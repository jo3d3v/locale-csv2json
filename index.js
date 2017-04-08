import 'babel-polyfill';
import './node_modules/angular/angular.js';
import PapaParse from 'papaparse';
import FileSaver from 'file-saverjs';
import JSZip from './node_modules/jszip/dist/jszip.js';
import { isObject, isString, forEach, assign, defaults, keys, reduce, set, has } from 'lodash-es';
import template from './csv2Json.html';


const PARSE_CONFIG = {
    header: true,
};
const UNPARSE_CONFIG = {
    quotes: true,
    quoteChar: '"',
    delimiter: ';',
    header: true,
    newline: "\r\n"
};
const JSON_FILE_REGEX = /.*[-_]([A-Z]{2})\.json$/;

class TranslationTransformator {
    constructor($http, $q, $location, $timeout) {
        this.__$http = $http;
        this.__$q = $q;
        this.__$location = $location;
        this.__$timeout = $timeout;
        this.jsonFilePattern = JSON_FILE_REGEX;
    }

    $onInit() {
        this.url = this.__$location.search().url;
        this.__$timeout(() => {
            this.__extractUrlAndCode();
            if (this.__code && this.form) {
                this.form.$setDirty();
            }
        });
    }

    transform() {
        this.missingTranslations = null;
        this.__$q
            .all([this.__buildReferenceModel(), this.__parseFile()])
            .then((results) => {
                let reference = results[0];
                let csv = results[1];
                if (!csv.meta.aborted) {
                    let keyField;
                    let langList = [];
                    let fileMap = {};
                    forEach(csv.meta.fields, function (field) {
                        if (field) {
                            if (field.toLowerCase() === 'key') {
                                keyField = field;
                            } else {
                                langList.push(field);
                            }
                        }
                    });
                    forEach(csv.data, function (row) {
                        if (has(reference, row[keyField])) {
                            forEach(langList, function (lang) {
                                set(fileMap, lang + '.' + row[keyField], row[lang]);
                            });
                            delete reference[row[keyField]];
                        }
                    });
                    this.missingTranslations = keys(reference);
                    let zip = new JSZip();
                    forEach(fileMap, function (data, lang) {
                        zip.file('locale-' + lang.toUpperCase() + '.json', JSON.stringify(data));
                    });
                    zip.generateAsync({type:"blob"}).then(function(content) {
                        FileSaver(content, 'locales.zip');
                    });
                }
            });
    }

    export() {
        this.missingTranslations = null;
        this.__buildReferenceModel().then((model) => {
            let csv = PapaParse.unparse({
                fields: ['key', this.__code],
                data: reduce(model, function (memo, value, key) {
                    memo.push([key, value])
                    return memo;
                }, [])
            }, );
            FileSaver(new Blob([csv], { type: 'text/csv' }), 'translations.csv');
        });
    }

    __extractUrlAndCode() {
        if (this.url && JSON_FILE_REGEX.test(this.url)) {
            let matches = this.url.match(JSON_FILE_REGEX)
            this.__code = matches[1];
        }
    }

    __parseFile() {
        return this.__$q((resolve, reject) => {
            if (this.csvFile) {
                PapaParse.parse(this.csvFile, defaults({
                    complete: resolve
                }, PARSE_CONFIG));
            } else {
                reject();
            }
        });
    }

    __buildReferenceModel() {
        return this.__$q((resolve, reject) => {
            this.__$http({
                method: 'GET',
                url: this.url,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                }
            }).then((response) => {
                resolve(this.__traverseJSON(response.data));
            }).catch(() => {
                this.form.url.$setValidity('notFound', false);
                this.form.url.$viewChangeListeners.push(() => {
                    this.form.url.$setValidity('notFound', true);
                });
            });
        });
    }

    __traverseJSON(json, prefix = '') {
        let obj = {};
        forEach(json, (value, key) => {
            let prefixKey = prefix ? prefix + '.' + key : key;
            if (!isObject(value)) {
                obj[prefixKey] = value;
            } else {
                assign(obj, this.__traverseJSON(value, prefixKey));
            }
        });
        return obj;
    }
}
TranslationTransformator.$inject = ['$http', '$q', '$location', '$timeout']

angular.module('csv2json', [])
    .component('csvTwoJson', {
        controller: TranslationTransformator,
        controllerAs: 'transform',
        template: template
    })
    .directive('file', [function () {
        return {
            scope: {
                file: "=file"
            },
            link: function ($scope, $element) {
                $element.bind('change', function (changeEvent) {
                    $scope.$applyAsync(function () {
                        $scope.file = changeEvent.target.files[0];
                    });
                });
            }
        }
    }]);