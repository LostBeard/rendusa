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

