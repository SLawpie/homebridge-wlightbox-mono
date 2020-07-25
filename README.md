# homebridge-wlightbox-mono

`homebridge-wlightbox-mono` is a [Homebridge](https://github.com/nfarina/homebridge) plugin to control Blebox wLightBox LED controller working with 4xMONO strips.

## Installation
... work in progress ...

## Configuration

```json
    {
        "accessory": "WLightBoxMono",
        "name": "someName",
        "channels": 4,  //connected channels / LED strips
        "names": [
            "Channel 1",
            "Channel 2",
            "Channel 3",
            "Channel 4"
        ],
        "ip": "wLightBox_ip",
        "updateInterval": 5000
}
```
