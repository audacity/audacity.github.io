---
title: Time stretching in Audacity 3.4
slug: audacity-3.4-timestretch
thumbnail: /blog1.png
author: Leo Wattenberg
date: September 30, 2023
layout: "../../layouts/PostLayout.astro"
description: A technical look into time stretching in Audacity 3.4
---

For Audacity 3.4, we've added a new time stretching feature, which can be accessed by holding Alt (macOS: Option) and dragging the edge of a clip. Additionally, when you change the project tempo, all clips in the project are adjusted to the new tempo.

This feature uses a time stretching algorithm that originated in [Staffpad](https://staffpad.net) and marks the beginning of a wider code sharing effort. In the future, this code sharing will extend in particular to Musescore, which has various components we will use - such as buttons and the general UI system, but also larger features like the mixer - and also may turn bi-directional, with Musescore using some of our technology in the future. Audacity's continued efforts in librarization of the code base certainly make code sharing easier, both between Muse products and also with third party developers.

<!-- add more dev-y talk here -->