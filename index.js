import 'babel-polyfill';
import jQuery from 'jquery';
import PapaParse from 'papaparse';
import FileSaver from 'file-saverjs';
import { isObject, isString, forEach, assign, defaults, keys } from 'lodash-es'

const PARSE_CONFIG = {
    header: true,
};

class TranslationTransformator {
    constructor() {
        // set up bindings
        this.fileHandle = jQuery('#locale-csv');
        this.url = jQuery('#local-json-base-path');

        jQuery('#transform-trigger').on('click', (event) => {
            this.transform(event);
        });
    }

    transform(event) {
        if (event) {
            event.preventDefault();
        }

        Promise.all([this.__buildReferenceModel(), this.__parseFile()]).then((results) => {
            console.log(results);
        });
    }

    __parseFile() {
        return new Promise((resolve, reject) => {
            if (this.fileHandle.get(0).files.length > 0) {
                PapaParse.parse(this.fileHandle.get(0).files[0], defaults({
                    complete: resolve
                }, PARSE_CONFIG));
            } else {
                reject();
            }
        });
    }

    __buildReferenceModel() {
        return new Promise((resolve, reject) => {
            jQuery.getJSON(this.url.val(), (data) => {
                resolve(this.__traverseJSON(data));
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

    run() {
    }

    static boot() {
        new TranslationTransformator().run();
    }
}

jQuery(function () {
    TranslationTransformator.boot();
});