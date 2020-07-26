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
        this.names = config.names || ['Channel 0', 'Channel 1', 'Channel 2', 'Channel 3'];
        this.ip = config.ip;
        this.updateInterval = config.updateInterval || 3000;
        this.statusTimer = null;
        this.currentValue = [0,0,0,0];
        this.currentValueTime = null;

        this.log.debug(`Names: ${this.names[0]}, ${this.names[1]}, ${this.names[2]}, ${this.names[3]}`);

        for (let i = 0; i < this.channels; i++) {
            const switchName = (this.name).concat(' ', (this.names[i]));
            const subtype = "channel" + i;
            
            this.services[i] = new Service.Lightbulb(switchName, subtype);

            this.services[i].getCharacteristic(Characteristic.On)
                 .on('set', this.statusLampSet.bind(this, i));
            this.services[i].getCharacteristic(Characteristic.Brightness)
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

        this.log.debug(`GET - channel number : ${number}`);

        this.statusGet(false, (error) => {
            if (error) {
                callback(error);
                return;
            }

        });
        callback(null, this.currentValue[number]);
        this.log.debug(`GET - channel[${number}] value: ${this.currentValue[number]}`);
    }

    statusLampSet(number, value, callback) {

        var hex = '';
        this.log.debug(`SET - channel[${number}] value: ${value}`);

        if (!value) {
           hex ="00";
           this.currentValue[number] = 0;
        } else if (value == true) {
            if ( this.currentValue[number] > 0) {
                hex = Math.round(this.currentValue[number] * 2.55).toString(16);
            } else {
                hex ="ff";
                this.currentValue[number] = 100;
            }
        } else {
            this.currentValue[number] = value;
            hex = Math.round(value * 2.55).toString(16);
            hex = "00".substr(0, 2 - hex.length) + hex;
            
        }
        

        var colorSet = '--------';
 
        colorSet = colorSet.substr(0, number * 2) + hex + colorSet.substr(number * 2 + 2);
 
        this.sendJSONRequest('http://' + this.ip + `/s/${colorSet}`, 'GET')
        .then((response) => {
            if (response) {
                const desiredColor = response.rgbw.desiredColor;
                for (let index = 0; index < 8; index++) {
                    var str = desiredColor.substr(index, 2);
                    this.currentValue[Math.floor(index/2)] = this.colorToBrightness(str);
                    index++;
                }
                this.currentValueTime = Date.now();
            }
            this.updateStatus(false);
            callback();
        })
        .catch((e) => {
            this.log.error(`Failed to switch: ${e}`);
            setTimeout(() => { callback(e); this.updateStatus(true); }, 2000);
        });
    }

    statusGet(forced, callback) {

        const now = Date.now();

        if (!forced && (now - this.currentValueTime < this.updateInterval) ) {
            this.log.debug('Status from variable');
            callback(null);
            return;
        }

        this.clearUpdateTimer();


        this.sendJSONRequest('http://' + this.ip + '/api/rgbw/state')
            .then((response) => {
                this.log.debug('Update done');
                this.currentValueTime = Date.now();

                const desiredColor = response.rgbw.desiredColor;
                for (let index = 0; index < 8; index++) {
                    var str = desiredColor.substr(index, 2);
                    this.currentValue[Math.floor(index/2)] = this.colorToBrightness(str);
                    index++;
                }

                this.setUpdateTimer();
            })
            .catch((e) => {
                this.log.error(`Error parsing: ${e}`);
                this.setUpdateTimer();
            })
    }

    updateStatus(forced = false) {
        this.log.debug('Updating switch status');
        this.statusGet(forced, (err) => {
            if (err) {
                this.log.debug(`Updating ERROR: ${err}`);
                return;
            }
        });

        this.log.debug('Updating characteristics');

        for (let index = 0; index < this.channels; index++) {
            this.services[index].getCharacteristic(Characteristic.On).updateValue(this.currentValue[index] > 0);
            this.services[index].getCharacteristic(Characteristic.Brightness).updateValue(this.currentValue[index]);
        };
       
    }

    setUpdateTimer() {
        this.log.debug('Update Timer : SET');
        this.statusTimer = setTimeout(() => { this.updateStatus(true); }, this.updateInterval);
    }

    clearUpdateTimer() {
        this.log.debug('Update Timer : CLEAR');
        clearTimeout(this.statusTimer);
    }

    sendJSONRequest (url, method = 'GET', payload = null) {
        return new Promise((resolve, reject) => {
            const components = new urllib.URL(url);
            const options = {
                method: method,
                host: components.hostname,
                port: components.port,
                path: components.pathname,
                protocol: components.protocol,
                headers: {'Content-Type': 'application/json'}
            };
            const req = http.request(options, (res) => {
                res.setEncoding('utf8');
                let chunks = '';
                res.on('data', (chunk) => { chunks += chunk; });
                res.on('end', () => {
                    try {
                        this.log.debug(`Raw response: ${chunks}`);
                        const parsed = JSON.parse(chunks);
                        resolve(parsed);
                    } catch (e) {
                        reject(e);
                    }
                });
            });
            req.on('error', (err) => {
                reject(err);
            });
            if (payload) {
                const stringified = JSON.stringify(payload);
                this.log(`sending payload: ${stringified}`);
                req.write(stringified);
            }
            req.end();
        });
    }

    colorToBrightness (str) {
        return Math.round(parseInt(str, 16) / 2.55);
    }
}





