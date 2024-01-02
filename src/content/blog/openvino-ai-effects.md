---
title: Introducing OpenVINO AI effects for Audacity
author: Leo Wattenberg
description:  A lot of our work has been focused on getting Audacity ready for a version 4. As such, a lot of under-the-hood work has been happening - in technical terms - reducing dependency on wxWidgets, library extractions and general refactoring. This work will continue for the next few releases in parallel with feature development. 
cover: "./openvino-logo-purple-black.png"
coverAlt: "OpenVINO logo"
publishDate: 2024-01-02
draft: false
---

Intel has built a suite of AI tools for Audacity, useful for spoken word audio and music alike. These AI features run 100% locally on your PC.

## AI tools for podcasts 

For spoken word content, the OpenVINO effects contain a noise supression and a transcription plugin. 

The **Noise Suppression** does what it says on the tin - it suppresses noise. As such it behaves similar to Audacity's built-in Noise Removal effect. 
* [More information on noise suppression](https://github.com/intel/openvino-plugins-ai-audacity/blob/main/doc/feature_doc/noise_suppression/README.md)

The **Transcription** powered by [Whisper.cpp](https://github.com/ggerganov/whisper.cpp) can both transcribe and translate words and outputs to a label track. If you want to export these transcriptions, you can do so via File → Export Other → Export Labels. 

* [More information on transcription](https://github.com/intel/openvino-plugins-ai-audacity/blob/main/doc/feature_doc/whisper_transcription/README.md)

## AI tools for music 

For music, both generation and separation plugins are part of the OpenVINO effects. 

**Music Generation** and **Music Style Remix** use Stable Diffusion (and [Riffusion](https://github.com/riffusion/riffusion) in particular) to generate new music from a prompt, or based on pre-existing music, respectively.

* More information on [Music Generation](https://github.com/intel/openvino-plugins-ai-audacity/blob/main/doc/feature_doc/music_generation/README.md) and [Music Style Remix](https://github.com/intel/openvino-plugins-ai-audacity/blob/main/doc/feature_doc/music_style_remix/README.md)

**Music Separation** can split a song into either it's vocal and instrumental parts, or into vocals, drums, bass and a combined "anything else" part. This is ideal for creating covers and playalongs.

* [More information on music separation](https://github.com/intel/openvino-plugins-ai-audacity/blob/main/doc/feature_doc/music_separation/README.md)


## Download and installation

The OpenVINO plugins are currently available for download here:  https://github.com/intel/openvino-plugins-ai-audacity/releases. 

Currently, only a Windows version is available for download. The project may be [compiled on Linux](https://github.com/intel/openvino-plugins-ai-audacity/blob/main/doc/build_doc/linux/README.md) and macOS, though no instructions are available for the latter yet.

If you have any questions or comments, feel free to post them to the plugin's [issue tracker](https://github.com/intel/openvino-plugins-ai-audacity/issues).