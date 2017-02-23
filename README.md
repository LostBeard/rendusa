![Logo of the project](http://rendusa.com/sites/rendusa/files/rendusa.png)

# Rendusa
Open Source 3D Media Player

See in action at
http://rendusa.com

## Installing / Getting started

Rendusa is primarily designed as a module for Drupal 7, but that is not 
required. The easiest way to get started is to install Rendusa into a 
working Drupal 7 installation. FFmpeg is required on your Drupal server.
 This may be changed in the future but currently allows useful features. 
 jQuery Update module for Drupal is also required.

To upload goto yoursite.com/?q=rendusa/media/upload
To view goto   yoursite.com/?q=rendusa/media/all

## Features

* Rendusa's primary design goal was to play lists of 2D+Z videos and images 
in various 3D output formats to support a larger possible audience to view 
the 3D sources.

* Rendusa is not just a media player for your site. It was designed with a 
Drupal module as well to allow uploading of supported media.

* Rendusa is modular. Don't like the user interface? Write your own and 
exchange the default one with yours.

* All of the input format handlers can be excluded if not needed simply by 
omitting them from the source list. Custom handlers can be added the same 
way.

## Supported 3D formats

Input
* 2D+Z
* 2D                    - coming soon
* Anaglyph              - coming soon
* Stereo Side by Side   - coming soon
* Stereo Over Under     - coming soon

Output 
(Some output formats may not be possible with given input)
* 2D
* Anaglyph              - Red Cyan, more to come
* 2D+Z                  - used by many glasses free autostereoscopic displays
* Exceptional 9 View    - a galsses free lenticular only auto-stereoscopic display
* Stereo Side by Side
* Stereo Over Under     - coming soon
* Checkerboard          - coming soon

Ask us to support your 3D format!

## Contributing

Contributions to rendusa are welcome. Contact me via GitHub or on 
http://rendusa.com

## Licensing

The code in this project is licensed under MIT license. My intention is to 
make this code available to any and all free of charge. No strings attached. 
I am not responsible for any negative affects of using this software.

## Donate

Rendusa is developed in my spare time which I have little of due to a 1 and a half year old daughter and being the only programmer in a 3D software company. Donating to the Rendusa development team will allow me to free up additional time to improve Rendusa and add new features. I can not guarantee that all requests will be followed, but I am open for discussion on making Rendusa the most useful and adaptable 3D video player for the web. Any donation amount helps.

```html
<form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top">
<input type="hidden" name="cmd" value="_s-xclick">
<input type="hidden" name="hosted_button_id" value="6WWLQN2X54PDN">
<input type="image" src="https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif" border="0" name="submit" alt="PayPal - The safer, easier way to pay online!">
<img alt="" border="0" src="https://www.paypalobjects.com/en_US/i/scr/pixel.gif" width="1" height="1">
</form>
```