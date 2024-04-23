---
title: Audacity 3.5
author: Leo Wattenberg
description:  Audacity 3.5 adds Cloud saving, automatic tempo detection and more!
cover: "./audacity-3.5.webp"
coverAlt: "Audacity 3.5: Cloud saving and more"
publishDate: 2024-04-22
draft: false
---

<iframe width="560" height="315" src="https://www.youtube.com/embed/qEAZv_o0HuQ" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>  <i>Watch the release video!</i>

We are excited to announce Audacity 3.5, which adds the following features:

## Cloud project saving

We've introduced a new cloud-saving feature that allows you to save your Audacity projects to audio.com. This allows you to work from any device, share & collaborate with others and restore previous versions if something went wrong.

## Automatic tempo detection

Audacity can now automatically detect the tempo of imported loops, and adjust them to be in tempo.
Tempo detection is done via both audio analysis and metadata checking. If you want to prepare your loop for automatic tempo detection without relying on audio analysis, both acidizer tempo tags or simply writing "123 bpm" anywhere into the filename work.
Automatic tempo detection can be disabled via Preferences -> Import/Export.

## Pitch shifting

You now can non-destructively change the pitch of a clip by holding Alt and pressing the Up and Down arrow keys. Alternatively, you can click on the overflow menu (...) and select "Pitch and speed...". When changing the pitch this way, an arrow in the UI indicates how much you've shifted it.

## and more!

There have been many other changes for this release. 

* Added the ability to export labels as subtitle files.
* Added an option to skip plugin scanning.
* Added an overflow menu, and speed and pitch indicators for clips.
* Various changes to a variety of features.
* Removed some niche features to simplify the app. This should make Audacity a bit less overwhelming to use, and also will speed up future development as fewer things need to be considered. 

A more detailed overview of these changes can be found in our [changelog](https://support.audacityteam.org/additional-resources/changelog/audacity-3.5). 
You can download Audacity on [audacityteam.org/download](/download).

The [Intel OpenVINO plugin](https://github.com/intel/openvino-plugins-ai-audacity/releases/tag/v3.5.0-R2) also has been updated for version 3.5. 