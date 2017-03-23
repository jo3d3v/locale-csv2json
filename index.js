import 'babel-polyfill';
import './node_modules/angular/angular.js';
import PapaParse from 'papaparse';
import FileSaver from 'file-saverjs';
import { isObject, isString, forEach, assign, defaults, keys } from 'lodash-es';


const PARSE_CONFIG = {
    header: true,
};

class TranslationTransformator {
    constructor($http, $q) {
        this.__$http = $http;
        this.__$q = $q;
    }

    transform() {
        this.__$q.all([this.__buildReferenceModel(), this.__parseFile()]).then((results) => {
            console.log(results);
        });
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
            this.__$http({ method: 'GET', url: this.url }).then((response) => {
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
TranslationTransformator.$inject = ['$http', '$q']

angular.module('csv2json', [])
    .component('csvTwoJson', {
        controller: TranslationTransformator,
        controllerAs: 'transform',
        templateUrl: 'csv2Json.html'
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