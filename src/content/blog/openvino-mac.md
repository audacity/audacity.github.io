---
title: OpenVINO AI Plugins are now available for macOS
author: Leo Wattenberg
description: "AI Music separation, noise suppression, music generation, transcription and super resolution is coming to macOS"
cover: "openvino-logo.webp"
coverAlt: "The openvino logo"
publishDate: 2025-06-11
draft: false
---

With Audacity 3.7.4, we finally are adding macOS support to the Intel OpenVINO AI plugins. Once you've [downloaded Audacity 3.7.4](/download) and [downloaded the OpenVINO plugins](/download/openvino) (and installed both), you should find them in **Effects → OpenVINO AI Effects**.

As a reminder, these effects are completely free and run on your own machine, no internet connection required. 

The following effects are available:

<ul class="list-disc space-y-2 mt-2">
<li>
<dt class="font-semibold">Music separation</dt>
<dd class="ml-2">
    Separate a mono or stereo track into individual stems -- Drums,
    Bass, Vocals, & Other Instruments.
</dd>
</li>
<li>
<dt class="font-semibold">Noise suppression</dt>
<dd class="ml-2">
    Reduce background noise in a recording. Works best on spoken word
    audio.
</dd>
</li>
<li>
<dt class="font-semibold">Music generation and continuation</dt>
<dd class="ml-2">
    Uses MusicGen LLM to generate snippets of music, or to generate a
    continuation of an existing snippet of music.
</dd>
</li>
<li>
<dt class="font-semibold">Whisper transcription</dt>
<dd class="ml-2">
    Transcribe audio to text using OpenAI's Whisper model. Tip: You
    can export the resulting label track as a subtitle file via File →
    Export other → Export labels.
</dd>
</li>
<li>
<dt class="font-semibold">Audio Super resolution</dt>
<dd class="ml-2">
    Increase the sampling rate of an audio signal – in other words, it
    upsamples audio to improve its fidelity, clarity, or compatibility
    with high-resolution standards. Useful for older 8kHz recordings,
    such as telephone calls.
</dd>
</li>
</ul>

## Feedback wanted
As this is the first release of these plugins for macOS, we're considering them to be a beta of sorts: While we've tested them on our machines, there's only so many devices flying about in our team. Thus, if you've got moment to try and test them on yours, we'd be greatful. We're especially interested in the following information:

* Did the effects you tried work? 
* What kind of mac model (year; Intel or Apple Silicon) and OS version are you using?
* What kind of binary are you using? (Apple Silicon/ARM or Intel/x64)
* Did you run into any trouble during the process of installing or using the plugins?

You can send us this feedback through various channels: 

* [Discord](https://discord.gg/audacity)
* [Our forum](https://forum.audacityteam.org/tag/openvino)
* [Our bug tracker](https://github.com/audacity/mod-openvino-macos/issues) (if you have a reproducible bug)
* [Intel's bug tracker](https://github.com/intel/openvino-plugins-ai-audacity/issues) (for OpenVINO feature requests)


## How to download & release notes
You can download Audacity 3.7.4 [here](/download) and the OpenVINO plugin [there](/download/openvino). We will also have them show up in the Get Effects button inside Audacity in the near future. 

From our testing, it appears that in some cases, the Intel binaries perform better, *even* on Apple Silicon macs. You may want to experiment with what binary you use.

The model downloader and installer supports macOS 12 onwards. If you [compile from source](https://github.com/audacity/mod-openvino-macos) or get the models from elsewhere, you might be able to get it running from OSX 10.15 (Intel macs) or macOS 11 (Apple Silicon macs) as well. 
