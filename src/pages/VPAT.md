---
layout: "../layouts/PageLayout.astro"
title: Audacity ® | Voluntary Product Accessibility Template
---

**Audacity 2.1.3 on Windows Voluntary Product Accessibility Template® Version 1.3**

The purpose of the **Voluntary Product Accessibility Template**, or **VPAT****™**, is to assist Federal contracting officials and other buyers in making preliminary assessments regarding the availability of commercial “Electronic and Information Technology” products and services with features that support accessibility. It is assumed and recommended that offerers will provide additional contact information to facilitate more detailed inquiries.

The first table of the Template provides a summary view of the Section 508 Standards. The subsequent tables provide more detailed views of each subsection. There are three columns in each table. Column one of the Summary Table describes the subsections of subparts B and C of the Standards. The second column describes the supporting features of the product or refers you to the corresponding detailed table, e.g., “equivalent facilitation.” The third column contains any additional remarks and explanations regarding the product. In the subsequent tables, the first column contains the lettered paragraphs of the subsections. The second column describes the supporting features of the product with regard to that paragraph. The third column contains any additional remarks and explanations regarding the product.

* * *

**Date:** 9 October 2017  
**Name of Product:** **Audacity 2.1.3 on Windows**  
**Contact for more Information (name/phone/email):** [discord](https://discord.gg/audacity) preferred, feedback@audacityteam.org

#### Summary Table



* Criteria: Section 1194.21 Software Applications and Operating Systems
  * Supporting Features: Supports with exceptions
  * Remarks and explanations: 
* Criteria: Section 1194.22 Web-based Internet Information and Applications
  * Supporting Features: Not applicable
  * Remarks and explanations: 
* Criteria: Section 1194.23 Telecommunications Products
  * Supporting Features: Not applicable
  * Remarks and explanations: 
* Criteria: Section 1194.24 Video and Multi-media Products
  * Supporting Features: Not applicable
  * Remarks and explanations: 
* Criteria: Section 1194.25 Self-Contained, Closed Products
  * Supporting Features: Not applicable
  * Remarks and explanations: 
* Criteria: Section 1194.26 Desktop and Portable Computers
  * Supporting Features: Not applicable
  * Remarks and explanations: 
* Criteria: Section 1194.31 Functional Performance Criteria
  * Supporting Features: Supports with exceptions
  * Remarks and explanations: 
* Criteria: Section 1194.41 Information, Documentation and Support
  * Supporting Features: Supports with exceptions
  * Remarks and explanations: 


#### Section 1194.21 Software Applications and Operating Systems – Detail



* Criteria: (a) When software is designed to run on a system that has a keyboard, product functions shall be executable from a keyboard where the function itself or the result of performing a function can be discerned textually.
  * Supporting Features: Supports with exceptions
  * Remarks and explanations: Major exceptions: clips, envelope points in time tracks and audio tracks, scrubbing.Minor exceptions include: links in the Welcome and About Audacity dialogs cannot be opened.
* Criteria: (b) Applications shall not disrupt or disable activated features of other products that are identified as accessibility features, where those features are developed and documented according to industry standards. Applications also shall not disrupt or disable activated features of any operating system that are identified as accessibility features where the application programming interface for those accessibility features has been documented by the manufacturer of the operating system and is available to the product developer.
  * Supporting Features: Supports
  * Remarks and explanations: 
* Criteria: (c) A well-defined on-screen indication of the current focus shall be provided that moves among interactive interface elements as the input focus changes. The focus shall be programmatically exposed so that Assistive Technology can track focus and focus changes.
  * Supporting Features: Supports with exceptions
  * Remarks and explanations: Exception to on-screen indication of focus: Immediately after a toolbar is undocked.Exception to focus being exposed to Assistive technology: Screen magnifiers do not show the correct focus in the table of the metadata editor.
* Criteria: (d) Sufficient information about a user interface element including the identity, operation and state of the element shall be available to Assistive Technology. When an image represents a program element, the information conveyed by the image must also be available in text.
  * Supporting Features: Supports with exceptions
  * Remarks and explanations: Major exceptions: clips in audio tracks; envelope points in audio tracks and time tracks.Minor exceptions include: in many effects there are sliders which have values in the range 0 to 100% rather than the values of parameters – however in most cases there is an associated text box for entering the value; the labels of group boxes are not read by the NVDA screen reader; column headings in the Edit chains dialog.
* Criteria: (e) When bitmap images are used to identify controls, status indicators, or other programmatic elements, the meaning assigned to those images shall be consistent throughout an application’s performance.
  * Supporting Features: Supports
  * Remarks and explanations: 
* Criteria: (f) Textual information shall be provided through operating system functions for displaying text. The minimum information that shall be made available is text content, text input caret location, and text attributes.
  * Supporting Features: Supports with exceptions
  * Remarks and explanations: Exception: the names of labels in label tracks. However, these names are also available in the Label editor, where they are provided as standard text.
* Criteria: (g) Applications shall not override user selected contrast and color selections and other individual display attributes.
  * Supporting Features: Does not support
  * Remarks and explanations: If a high contrast Windows theme is used: Not all user interface elements in Audacity use this theme; for some elements where it is used, text becomes unreadable.
* Criteria: (h) When animation is displayed, the information shall be displayable in at least one non-animated presentation mode at the option of the user.
  * Supporting Features: Not applicable
  * Remarks and explanations: There is no animation.
* Criteria: (i) Color coding shall not be used as the only means of conveying information, indicating an action, prompting a response, or distinguishing a visual element.
  * Supporting Features: Supports with exceptions
  * Remarks and explanations: Exceptions: audio waveforms, and spectrograms.
* Criteria: (j) When a product permits a user to adjust color and contrast settings, a variety of color selections capable of producing a range of contrast levels shall be provided.
  * Supporting Features: Not applicable
  * Remarks and explanations: Color and contrast are not adjustable by the user.
* Criteria: (k) Software shall not use flashing or blinking text, objects, or other elements having a flash or blink frequency greater than 2 Hz and lower than 55 Hz.
  * Supporting Features: Supports
  * Remarks and explanations: 
* Criteria: (l) When electronic forms are used, the form shall allow people using Assistive Technology to access the information, field elements, and functionality required for completion and submission of the form, including all directions and cues.
  * Supporting Features: Supports with exceptions
  * Remarks and explanations: Exceptions: the labels of group boxes are not read by the NVDA screen reader.


#### Section 1194.31 Functional Performance Criteria – Detail



* Criteria: (a) At least one mode of operation and information retrieval that does not require user vision shall be provided, or support for Assistive Technology used by people who are blind or visually impaired shall be provided.
  * Supporting Features: Supports with exceptions
  * Remarks and explanations: Major exceptions: clips, envelope points in time tracks and audio tracks, scrubbing.
* Criteria: (b) At least one mode of operation and information retrieval that does not require visual acuity greater than 20/70 shall be provided in audio and enlarged print output working together or independently, or support for Assistive Technology used by people who are visually impaired shall be provided.
  * Supporting Features: Supports with exceptions
  * Remarks and explanations: Audacity supports the use of screen magnifiers. However in two cases the focus is incorrectly shown by screen magnifiers: immediately after a toolbar is undocked; the table in the metadata editor.Audacity does not support the Windows high contrast theme.
* Criteria: (c) At least one mode of operation and information retrieval that does not require user hearing shall be provided, or support for Assistive Technology used by people who are deaf or hard of hearing shall be provided
  * Supporting Features: Supports
  * Remarks and explanations: 
* Criteria: (d) Where audio information is important for the use of a product, at least one mode of operation and information retrieval shall be provided in an enhanced auditory fashion, or support for assistive hearing devices shall be provided.
  * Supporting Features: Supports
  * Remarks and explanations: 
* Criteria: (e) At least one mode of operation and information retrieval that does not require user speech shall be provided, or support for Assistive Technology used by people with disabilities shall be provided.
  * Supporting Features: Supports
  * Remarks and explanations: 
* Criteria: (f) At least one mode of operation and information retrieval that does not require fine motor control or simultaneous actions and that is operable with limited reach and strength shall be provided.
  * Supporting Features: Supports with exceptions
  * Remarks and explanations: Some users may have difficulty in using the Draw and Envelope tools.


#### Section 1194.41 Information, Documentation and Support – Detail



* Criteria: (a) Product support documentation provided to end-users shall be made available in alternate formats upon request, at no additional charge
  * Supporting Features: Supports with exceptions
  * Remarks and explanations: The Audacity manual is written in HTML. From this, the user can produce the manual in alternative formats, if required.
* Criteria: (b) End-users shall have access to a description of the accessibility and compatibility features of products in alternate formats or alternate methods upon request, at no additional charge.
  * Supporting Features: Supports with exceptions
  * Remarks and explanations: The Audacity manual covers accessibility, and is written in HTML. From this, the user can produce the manual in alternative formats, if required.
* Criteria: (c) Support services for products shall accommodate the communication needs of end-users with disabilities.
  * Supporting Features: Supports
  * Remarks and explanations: In addition to the Audacity support forums, there is also the Audacity4Blind mailing list, which is specifically for visually impaired users.
