## Introduction

Our Garden is data visualization collage and tool for long-distance relationship to see how facing online and offline shaping this relationship's homestatis in the digital era. It records the facing time online of me and my boyfriend for almost two years as a form of collage dairy ,and allow me to keep updating the data to continue create the work.


## Inspiration
Doing collage is my way of writing dairies as a person who love to keep records of things happened every day. Since last year I met my boyfriend and we are keeping apart to different time zones due to different life track. Thanks to internet who joint us connections and made us feel like more intimate by seeing each other everyday online, I noticed that the increasing facing time online makes the missing data of it as it is not like text messages thta can be stored. All it presents are just the duration and time. Can it mean somethings to how our relationship grows? And can the visualization help us reallocate our personal time with time zones?

An app called Forest inpired me. As a tool for concentration, it changes simple accumulated concentration time to different kinds of trees and to forest as an incentive mechanism. For long-distance relationships, it is about communication, trust,  and respect to each other's time.
A coloring book called *Serect Garden" also provide me with inpiration. It 

## Data Collecting and Orgnization
I began by extracting our video facing time

I predict some of the mood by scanning through the text content of the video call

The manul data orgnazation process is also a rememorize process




Our Garden 🌿

A personal data–visualization collage and time-based relationship archive

Overview

Our Garden is a generative visualization and ongoing personal recording tool that transforms the daily video-call duration between two people in a long-distance relationship into an evolving digital ecosystem. Instead of representing communication as static metrics, the project uses time, rhythm, and absence as “nutrients” that grow and shape an organic garden—visualizing how a relationship sustains homeostasis across physical distance and mismatched time zones.

This project is continuously updated: as new call data are logged, the garden grows new forms, changes density, and gradually reveals the temporal patterns that accumulate through everyday presence.

Conceptual Motivation

Long-distance relationships depend on a delicate balance: attention, communication, trust, and accommodation across different schedules and geographic separation. Although digital platforms make constant connection possible, they also produce a paradox—the more we face each other online, the fewer material traces remain.

Text messages leave archives. Video calls do not.
No transcripts, no saved conversations—just time.
Duration becomes the only residue.

This absence is meaningful. In contemporary digital life, we often measure ourselves through data, yet the most emotionally important interactions generate the least recordable traces. Inspired by ideas from data humanism (Giorgia Lupi), relational homeostasis, and temporal ecology, Our Garden treats time as both data and metaphor:

Time spent → nutrients

Gaps / silence → soil dryness, rough petals

Night calls vs day calls → different bloom intensities

Weeks → flowering cycles

By visualizing only what survives (time), the garden foregrounds what disappears (content).
The visualization becomes a diary not of words, but of presence.

Inspiration

This project is rooted in my personal habit of documenting life through collage. Collage preserves fragments—textures, arrangements, small pieces of everyday life. When I entered a long-distance relationship spanning two time zones (UTC-8 and UTC+8), collage became a metaphor for how our relationship itself assembles across discontinuous time blocks.

A focus app called Forest also inspired me. It turns concentration time into growing trees. But while Forest treats time as reward, Our Garden treats time as memory**—**a soft infrastructure that holds our relationship together.

Data Model & Pipeline

The project engages the full data–visualization pipeline:

1. Data Acquisition

Call records are manually logged through a custom form, including:

date

duration_min

day_time_self (morning/noon/night)

num_calls

initiator (me/him)

mood (optional: missing, calm, happiness, longing, anger)

location_self / location_other

latitude/longitude (optional)

2. Cleaning & Aggregation

Daily records → weekly aggregates:

weekly total minutes

active days

night-day ratio

longest silent gap

facing rhythm

3. Visual Encoding

Each week = a flower:

flower radius → weekly total duration

petal count → active days

glow ratio → night-call intensity

roughness → silent gaps

color → mood distribution (optional)

Daily records → nutrient particles drifting along the garden’s river path.

Interaction

Hover a flower → see its weekly summary

Zoom/pan → explore different “seasons”

Filter → show night calls / long calls / missing calls

Live updating → garden grows as new data is added

Tech Stack

p5.js for generative drawing

CSV data source

Optional integration with Google Sheets for continuous updates

Why a Garden?

Because relationships are ecosystems.
They grow, fluctuate, adapt, and sometimes go dormant.
Because distance is not an absence—it is a condition for cultivation.
Because duration is the only measurable trace that remains.

In long-distance communication, time is not a metric;
It is a gift, a resource, a rhythm, and part of the emotional climate.

Future Work

Integrate a timeline scrubber

Add geographic mapping layers

Introduce sound synthesis based on duration rhythms

Export seasonal “garden posters”