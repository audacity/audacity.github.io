---
title: On Audio Quality
author: Leo Wattenberg
description: Audio quality is subject to much confusion. This blog post is to clear some of it up in easy terms. 
cover: "./spectrogram.png"
coverAlt: "Spectrogram illustration"
publishDate: 2024-01-23
draft: true
---

The concept of audio quality is plagued with trickiness and misconceptions. This post addresses some of them and hopefully helps you maximize your quality while minimizing files size.

## Lossy vs lossless

There are two fundamental classes of audio formats: Lossy ones (such as MP3, OGG or M4A/AAC) and lossless ones (such as WAV or FLAC). Lossless audio formats work like ZIP files, the audio stored in these formats can be unpacked to be 1:1 the original audio. This is not true for lossy formats; they use advanced psychoacoustic models to discard some data to make files significantly smaller. 

And this is where we already run into our first hurdle on assessing audio quality: It may seem that lossy audio is always lower quality, but that's not strictly true. Lossy formats can turn "[transparent](https://wiki.hydrogenaud.io/index.php?title=Transparency)" at a high enough bitrate. Depending on the content, the listener's hearing and equipment, MP3 files at the standard quality (170-210 kbps) are already be transparent. For more modern audio formats such as M4A/AAC and Opus, this is even lower. So if all you want is to put as many audio files on your phone with a quality near-indistinguishable from the original, Opus at somewhere around 160 kbps is a good choice - it's what YouTube uses as well. 

If you want to edit your files later though, lossy formats are a bad choice as they're subject to [generation loss](https://en.wikipedia.org/wiki/Generation_loss). The more often you open and save an MP3, the more noisy it will get. For the purposes of editing, a lossless format is much better suited. 

## Joint Stereo vs Stereo

In previous versions of Audacity, you could choose between Joint Stereo and Stereo when exporting as MP3. There is a myth from the early 2000s floating around that Stereo is better in some circumstances, but that hasn't been true for 2 decades now. Today, Joint Stereo mode always selects the best quality, which is why the option to choose the other Stereo has been removed in Audacity 3.4. More details can be found [in this discussion](https://github.com/audacity/audacity/discussions/4940).

## Constant bitrate vs variable bitrate (MP3 320 kbps vs MP3 V0)

As we've discussed above, MP3 at these bitrates is definitely transparent. The main difference between these quality options is that "Insane" is a constant bitrate (320 kbps), while the "Extreme" option is variable between 220 and 260 kbps. Cheaper MP3 players sometimes don't quite know how to handle variable bitrates, so for those, the "Insane" option may be appropriate - or any other bitrate above 200 kbps, really. In all other cases, the "Extreme" (V0) option is going to result in quality indistinguishable from perfect, while keeping file sizes considerably smaller if the content doesn't need to use all of the available bandwidth.

## Measuring audio quality

It's tempting to open up [spectrogram view](https://support.audacityteam.org/audio-analysis/spectral-analysis#spectrogram-view) to confirm that, indeed, lossy formats lose some data. However, it's not quite right to assume a loss in quality from this. Quality is *not* what you can see in a spectrogram, rather, it depends on psychoacoustics. While there are some tools which try to model psychoacoustics to determine quality such as [POLQA](https://en.wikipedia.org/wiki/Perceptual_Objective_Listening_Quality_Analysis), models are necessarily less complex than the human brain. POLQA was developed specifically for speech and [is not too good of a measure of quality outside that field](https://arxiv.org/ftp/arxiv/papers/2110/2110.11438.pdf). 

The best way to measure quality is to run a form of a [codec listening test](https://en.wikipedia.org/wiki/Codec_listening_test) - typically an ABX test. The community over at [hydrogenaudio](https://hydrogenaud.io/index.php/board,40.0.html) has conducted several such tests which you can read - or do the tests yourself. 

## Other quality questions

Do you have some other questions about audio quality? Feel free to ask them [in our Forum](https://forum.audacityteam.org/).