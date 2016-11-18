'use strict';

const request = require('request-promise');
const cheerio = require('cheerio');
const Promise = require('bluebird');
const _ = require('lodash');
const config = require('./config');

const cookieJar = request.jar();

function Authenticate() {
    return request({
        method: 'POST',
        uri: 'https://moodle.socs.uoguelph.ca/login/index.php',
        jar: cookieJar,
        resolveWithFullResponse: true,
        simple: false,
        followAllRedirects: true,
        form: {
            username: config.username,
            password: config.password,
            anchor: ''
        }
    });
}

function GetClassPage() {
    return request({
        method: 'GET',
        uri: 'https://moodle.socs.uoguelph.ca/course/view.php?id=85',
        jar: cookieJar,
        resolveWithFullResponse: true,
        simple: false
    })
}

function FindEvaluationLink(body) {
    const $ = cheerio.load(body);
    let evaluationLink;

    $('.activity a').each(function () {
        if ($(this).text().indexOf(config.evaluation_text) != -1) {
            evaluationLink = $(this).attr('href');
            return false;
        }
    });

    return evaluationLink;
}

function GetEvaluationPage(res) {
    let evaluationLink = FindEvaluationLink(res.body);

    if (_.isUndefined(evaluationLink)) {
        throw new Error(`Unable to find link containing text ${config.evaluation_text}`);
    }

    return request({
        method: 'GET',
        uri: evaluationLink,
        jar: cookieJar,
        resolveWithFullResponse: true,
        simple: false
    });
}

function GetEditPage(res) {
    const $ = cheerio.load(res.body);

    return request({
        method: 'GET',
        uri: $('.nav.nav-tabs li').eq(3).find('a').attr('href'),
        jar: cookieJar,
        resolveWithFullResponse: true,
        simple: false
    });
}

Authenticate()
    .then(GetClassPage)
    .then(GetEvaluationPage)
    .then(GetEditPage)
    .then((res) => {
        const $ = cheerio.load(res.body);
        const baseForm = _.fromPairs(_.map($('form').serializeArray(), i => [i.name, i.value]));

        return Promise.map(config.evaluations, (evaluee) => {
            let id, evaluation;

            if (_.isObject(evaluee)) {
                id = evaluee['id'];
                evaluation = evaluee['evaluation'];
            } else if (_.isString(evaluee)) {
                id = evaluee;
                evaluation = config.default_evaluation;
            }

            const formCopy = _.clone(baseForm);

            formCopy['field_199'] = id;
            formCopy['field_198'] = evaluation;

            console.log(`Submitting ${id}'s evaluation of ${evaluation}`);

            return request({
                method: 'POST',
                uri: 'https://moodle.socs.uoguelph.ca/mod/data/edit.php',
                formData: formCopy,
                jar: cookieJar,
                simple: false
            }).then(() => {
                console.log(`Done submitting ${id}'s evaluation`);
            });
        });
    })
    .then(() => {
        console.log('Done');
    });

