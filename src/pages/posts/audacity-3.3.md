---
title: Audacity 3.3 
slug: /audacity-3.3
thumbnail: /audacity-3.3.png
author: Leo Wattenberg
date: April 25, 2023
layout: "../../layouts/PostLayout.astro"
description: A lot of our work has been focused on getting Audacity ready for a version 4. As such, a lot of under-the-hood work has been happening - in technical terms - reducing dependency on wxWidgets, library extractions and general refactoring. This work will continue for the next few releases in parallel with feature development. 
---
<figure><img src="/beats-and-bars.png"/></figure>
A lot of our work has been focused on getting Audacity ready for a version 4. As such, a lot of under-the-hood work has been happening - in technical terms - reducing dependency on wxWidgets, library extractions and general refactoring. This work will continue for the next few releases in parallel with feature development.

By and large Audacity 3.3 is a quiet update, with most of the work being done under the hood. Some noteworthy changes:

* Some built-in effects are realtime capable now
* A new **Shelf Filter** effect has been added, it’s in the EQ & Filters category
* An initial (beta) version of a [beats and measures](https://support.audacityteam.org/music/aligning-music-to-beats-and-measures) feature has been added, you can enable it via View → Toolbars → Time Signature Toolbar (beta), then right-clicking the timeline to change to beats and measures, and then changing the snapping and time and selection toolbar clocks to a beats format.
* A new vertical ruler (**Linear (dB)**) has been added, you can enable it by right-clicking on the vertical ruler.
* **Project Rate** has been moved to the Audio Setup button → Audio Settings and renamed Project Sample Rate.

More changes can be found in the changelog: [Audacity 3.3 – Audacity Support](https://support.audacityteam.org/additional-resources/changelog/audacity-3.3)