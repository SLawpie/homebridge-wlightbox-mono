"use strict";

const http = require('http');
const urllib = require('url');

var Accessory, Service, Characteristic, UUIDGen;

module.exports = function (homebridge)
{
    Accessory = homebridge.platformAccessory;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;
    homebridge.registerAccessory("homebridge-wlightbox-mono", "WLightBoxMono", WLightBoxSwitch)
}

class WLightBoxSwitch {

    constructor (log, config) {
        this.services = [];
        this.service
        this.log = log;
        this.name = config.name;
        this.channels = config.channels || 4;
        this.names = config.names || ['Switch 0', 'Switch 1', 'Switch 2', 'Switch 3'];
        this.ip = config.ip;
        this.updateInterval = config.updateInterval || 60000;
        this.current_status = [0,0,0,0];
        this.status_callbacks = new Array();
        this.current_status_time = null;

        this.log.debug(`Names: ${this.names[0]}, ${this.names[1]}, ${this.names[2]}, ${this.names[3]}`);

        for (let i = 0; i < this.channels; i++) {
            const switchName = (this.name).concat(' ', (this.names[i]));
            const subtype = "switch" + i;
            
            this.services[i] = new Service.Lightbulb(switchName, subtype);

            this.services[i].getCharacteristic(Characteristic.On)
                 .on('get', this.statusLampGet.bind(this, i))
                 .on('set', this.statusLampSet.bind(this, i));
            this.services.push(this.switch1Service);
            
            this.log.debug(`Register LED strip: ${switchName} / ${subtype}`);
        };

        this.updateStatus(true);
    }

    getServices() {
        return this.services;
    }

    statusLampGet(number, callback) {

        this.log.debug(`Number GET : ${number}`);

        this.statusGet(false, (error) => {
            if (error) {
                callback(error);
                return;
            }

        });
        callback(null, this.current_status[number] > 0);
        this.log.debug(`Triggered GET : ${this.current_status[number]}`);
    }

    statusLampSet(number, value, callback) {

        this.log.debug(`Triggered SET On: ${value} for ${number}`);

        if (value)
            this.current_status[number] = 255;
        else
            this.current_status[number] = 0;

        callback(null);
    }

    statusGet(forced, callback) {

        if (forced) {
            const dummy = "ff00ff00";

            for (let index = 0; index < 8; index++) {
                var str = dummy.substr(index, 2);
                this.log.debug(`${Math.floor(index/2)} - substr [${index}]: ${str} -> ${dummy}`);
                this.current_status[Math.floor(index/2)] = parseInt("0x" + str);
                index++;

            }
        }

    }

    updateStatus(forced = flase) {
        this.log.debug('Updating switch status');
        this.statusGet(forced, (err) => {
            if (err) {
                this.log.debug(`Updating ERROR: ${err}`);
                return;
            }
        });

        this.log.debug('Updating characteristics');

        for (let index = 0; index < this.channels; index++) {
            this.services[index].updateCharacteristic(Characteristic.On,  this.current_status[index] > 0);
        };
       
    }



}



    // sendJSONRequest (url, method = 'GET', payload = null) {
    //     return new Promise((resolve, reject) => {

    //         const components = new urllib.URL(url);

    //         const options = {
    //             method: method,
    //             host: components.hostname,
    //             port: components.port,
    //             path: components.pathname,
    //             protocol: components.protocol,
    //             headers: {'Content-Type': 'application/json'}
    //         };
    
    //         const req = http.request(options, (res) => {
    //             res.setEncoding('utf8');

    //             let chunks = '';
    //             res.on('data', (chunk) => { chunks += chunk; });
    //             res.on('end', () => {
    //                 try {
    //                     this.log.debug(`Raw response: ${chunks}`);
    //                     const parsed = JSON.parse(chunks);
    //                     resolve(parsed);
    //                 } catch(e) {
    //                     reject(e);
    //                 }
    //             });
    //         });
    //         req.on('error', (err) => {
    //             reject(err);
    //         });
    //         req.end();
    //     });
    // }


