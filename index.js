const puppeteer = require('puppeteer');
// const request = require("request-promise-native");
const { bypassCaptcha } = require("./captcha");

const url = "http://democaptcha.com/demo-form-eng/hcaptcha.html";
if (!url) {
    throw "Please provide URL as a first argument";
}
async function run () {
    const browser = await puppeteer.launch({headless:false});
    const page = await browser.newPage();
    const navigationPromise = page.waitForNavigation({ waitUntil: ["networkidle0"] });
    await page.goto(url);

    
    const value = await validateCaptcha(page)
    console.log({value})
    if (value === false) {
        const dataSiteKey = await page.$eval('.h-captcha', (e) => e.getAttribute('data-sitekey'));
        console.log({dataSiteKey})
        const response = await bypassCaptcha(page.url(),dataSiteKey);
        console.log("bypass response:",response)
        await sleep(10000);
        
        await page.$eval("textarea[name='h-captcha-response']", (elem, inputtext) => {
            elem.value = "";
            elem.value = inputtext;
        }, response);

        await page.$eval("textarea[name='g-recaptcha-response']", (elem, inputtext) => {
            elem.value = "";
            elem.value = inputtext;
        }, response);
        
        await sleep(20000)
        console.log(`submitted the functionality`);
        await page.$eval("form", form => form.submit());
    }

    await navigationPromise
    await page.screenshot({path: 'screenshot.png'});
    browser.close();
}
run()


async function validateCaptcha(page){
    try {
        console.log("hcaptch validation started");
        const isNotHidden = await page.$eval(`.h-captcha`, elem => {
            return true;
        });
        console.log(`capcha isNotHidden: ${isNotHidden}`);

        if (isNotHidden) {
            console.log("Captcha found.");
            return false;
        }
    } catch (e) {
        console.log(`No Captcha. We can forward the flow: ${e}`);
        return true;
    }
}


async function sleep (ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
};