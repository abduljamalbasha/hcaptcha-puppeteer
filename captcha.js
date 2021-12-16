
const request = require("request-promise-native");
const poll = require("promise-poller").default;

const recaptchaKey = process.env.RECAPTCHA_KEY;

module.exports.bypassCaptcha = async (pageurl, sitekey) => {
    try {
        console.log('recaptchaKey, pageurl, sitekey:',recaptchaKey, pageurl, sitekey)
        const requestId = await initiateCaptchaRequest(recaptchaKey, pageurl, sitekey);
        console.log('requestId:',requestId)
        const response = await pollForRequestResults(recaptchaKey, requestId);
        console.log(`bypassCaptcha captcha response : ${response}`);
        return response;
    } catch (e) {
        console.log(`bypassCaptcha captcha error : ${e}`);
    }
};

async function initiateCaptchaRequest (apiKey, pageurl, sitekey) {
    const formData = {
        method: "hcaptcha",
        sitekey: sitekey,
        key: apiKey,
        pageurl: pageurl,
        json: 1
    };
    const response = await request.post("http://2captcha.com/in.php", { form: formData });
    console.log(`initiateCaptchaRequest captcha response : ${response}`);
    return JSON.parse(response).request;
}

async function pollForRequestResults (
    key,
    id,
    retries = 30,
    interval = 3000,
    delay = 20000
) {
    await timeout(delay);
    return poll({
        taskFn: requestCaptchaResults(key, id),
        interval,
        retries,
    });
}

function requestCaptchaResults (apiKey, requestId) {
    const url = `http://2captcha.com/res.php?key=${apiKey}&action=get&id=${requestId}&json=1`;
    console.log(url);
    return async function () {
        return new Promise(function (resolve, reject) {
            request.get(url).then(rawResponse => {
                console.log(rawResponse);
                const resp = JSON.parse(rawResponse);
                if (resp.status === 0) return reject(resp.request);
                resolve(resp.request);
            });
        });
    };
}

const timeout = millis => new Promise(resolve => setTimeout(resolve, millis));
