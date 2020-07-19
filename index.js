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


function WLightBoxSwitch(log, config) {

        this.services = [];
        this.log = log;
        this.name = config.name;
        this.channels = config.channels || 4;
        this.names = config.names || ['Switch 0', 'Switch 1', 'Switch 2', 'Switch 3'];
        this.ip = config.ip;
        this.current_status = [0,0,0,0];
        this.status_callbacks = new Array();
        this.current_status_time = null;

        this.log.debug(`Names: ${this.names[0]}, ${this.names[1]}, ${this.names[2]}, ${this.names[3]}`);

        for (let i = 0; i < this.channels; i++) {
            const switchName = (this.name).concat(' ', (this.names[i]));
            const subtype = "switch" + i;
            this.services[i] = new Service.Switch(switchName, subtype);
            this.log.debug(`Register switch: ${switchName} / ${subtype}`);
        }
        //this._service = new Service.Switch((this.name).concat(' ', (this.names[0])));
}
  

WLightBoxSwitch.prototype.getServices = function() {
    return this.services;
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


