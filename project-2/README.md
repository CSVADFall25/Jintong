## Introduction

***Our Garden*** is a data-visualization tool for creating personalized collage diaries using data-generated patterns. It is based on my long-distance relationship with my boyfriend and visualizes our video-calling and location data from July 2025 to today.

The tool generates flower patterns and other elements from a selected date range, recording our online “facing time” as growing visual forms. It also allows custom drag-and-drop collage making, turning data into a dynamic diary.

I used Copilot to help organize and generate some of the code.

## Inspiration
Collage has always been my way of keeping diaries. I like recording everyday details through fragments and textures.

Since last year, my boyfriend and I have lived in different places or time zones. Thanks to the internet, we’ve managed to see each other every day online. But unlike text messages, video calls leave no stored record, only duration and time.

The app [Forest](https://www.forestapp.cc/) inspired me. It turns focused time into trees and forests as an incentive mechanism. For relationships, communication, trust, and respect for each other’s time play a similar role.

I also took a few images as aesthetic references for color, softness, and paper-collage texture.

<img src="https://i.pinimg.com/originals/b5/64/86/b5648682b9a5a7236c641047576e4a60.jpg" width="300"> <img src="https://pbs.twimg.com/media/GT8n2RnXIAAcMoH?format=jpg&name=900x900" width=300>

## Data Collecting and Orgnization
I manually extracted our video-call data from WeChat, including:

- date
- time of day
- call duration and ending time
- initiator (who called first)
- locations (city, latitude, longitude)
- mood during the call
- brief notes recording small shared memories

When memories were unclear, I predicted mood and notes by scanning text or recalling impressions.

Eight moods were used: happiness, calm, intimacy, care, longing, anxiety, anger, and sadness.
If the mood was uncertain, I marked it as missing.

Originally, I planned to extract data from January 2024 when our relationship began, but manual extraction was too time-consuming, so I used a five-month dataset (July-November) as a test and limited visualization to a two-month range for clarity.

## Design and Composite
I started by defining the visual flow and color system. The style is simple yet warm, with added paper texture for an organic collage look.

The first UI panel allows selecting a date range (max 2 months) to generate flowers. Each flower contains five days of data:

- Petal size → call duration (longer = larger)

- Petal color → mood

- Mood colors:
    
    - happiness – gold
    - intimacy – pink
    - care – green
    - calm – light blue
    - longing – blue
    - sadness – gray
    - anxiety – orange
    - anger – red
    - missing – opaque white
    
Hovering over a petal displays detailed video-call information.

The second UI panel generates other elements:

- Selecting “initiator” creates flower stems and leaves—black leaves for his calls, green leaves for mine.

- Hovering on the flower’s heart shows total duration and the number of calls from each side.

- Selecting “time of day” generates a sun, with rays representing call periods:

    - morning – white
    - noon – orange
    - afternoon – yellow
    - evening – blue
    - night – black

    Ray length corresponds to call duration. Hovering on the sun shows the total number of calls for each time period.

- I also considered adding rain or clouds based on other variables but ran out of time.

The third UI panel lets users add text on the canvas and clear or save the collage.

## Limitations and Future Development
- The date range and flower rendering can be refined.

- Currently it only reads my data; in the future it could accept any uploaded dataset.

- The UX could improve—changing colors, size, or rotation; adding more generative elements; and exporting both the collage and its underlying data together.