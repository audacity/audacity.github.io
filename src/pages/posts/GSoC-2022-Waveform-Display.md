---
title: GSoC 2022 - Fundamental Ruler and Waveform Display
slug: GSoC-2022-Waveform-Display
thumbnail: /waveform.png
author: Michael Papadopoulos
date: September 1, 2022
layout: "../../layouts/PostLayout.astro"
description: Hello everyone! Now that Google Summer of Code 2022 has wrapped up, I’d like to present the work that I have done over the summer. I would also like to take the time to thank Audacity for giving me this opportunity that has made me much more aware of, and competent in, open-source development. Please use this link if you would like to return to my first blog post and read about the project from the beginning.
---

Hello everyone! Now that Google Summer of Code 2022 has wrapped up, I’d like to present the work that I have done over the summer. I would also like to take the time to thank Audacity for giving me this opportunity that has made me much more aware of, and competent in, open-source development. Please use this link if you would like to return to my first blog post and read about the project from the beginning.

# Code changes 
You can view the final state of my work for GSoC on this [pull request](https://github.com/audacity/audacity/pull/3598).

# Project summary
I have met most of the goals originally proposed, with the structure of the Rulers updated for increased flexibility and the vertical Linear dB Waveform ruler and Beats & Measures timer having been created. Here is a summary of the changes made for this project:

##### Ruler Restructuring
- The <mark>RulerFormatM</mark> and <mark>RulerUpdater</mark> classes, as well as their large number of subclasses, were created by extracting and reformatting existing code into polymorphic objects.
- The SetUpdater and SetFormat functions were created to support this polymorphism for the Ruler, replacing the SetLog and SetCustom functions which restricted the ruler to messier switch statements.
- The SetUpdaterData and SetFormatData functions were created on the Ruler to allow for data of any type to be passed to the ruler. This replaces the SetUseZoomInfo function as well as other functions which control ZoomInfo, and open up the doors for much more flexible data passing.
- Restructured Ruler structs like TickSizes, and added the ability to set minorMinor ticks (the smallest tick size) using TickSizes. This gives increased flexibility to updaters that rely on this, like the default LinearUpdater.

##### Linear dB Ruler
- A new ruler option was created for the Waveform ruler, which can be accessed through the right-click menu as well as preferences dialogue.
- This utilizes the new CustomUpdaterValue updater, which allows the specific necessary dB values for a linear dB ruler to be passed to the ruler creation function.
- Code was written to generate these values and update the ruler as necessary, as well as make it responsive to a variety of decibel ranges and track sizes.

##### Beats & Measures Ruler
- A new ruler format, BeatsFormat, was created, which relies on the new ability to pass in data to a ruler format.
- A new option for the time ruler was created which utilizes BeatsFormat to display time based on user-defined beats per minute and time signature. This data can be set in the preferences dialogue.
- A new format in the bottom time panel was made which displays bars and beats, and lets users snap to beats when selecting on their track.

I’d like to especially thank my mentor Paul Licameli, as well as the support from everyone on the Audacity team, including but not limited to Dmitry Vedenko, Peter Sampson, and Peter Jonas. I hope that my work can lead to many new and useful development for Audacity’s user interface in the future.