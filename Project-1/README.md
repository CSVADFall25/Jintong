# Folding Surprise

## Description

*Folding Surprise* is a small game about distance, connection, and surprise. It lets two people (who might be far apart) draw together without knowing what the other is creating. Both players enter the same room and start drawing at the same time. For one minute, they can only see 1/4 of their shared canvas. When time is up, the drawings unfold and merge into one.

You can try it here: http://169.231.109.0:3000/ (If the live server link is unavailable, you can clone the repository to run it locally. Please ensure you run `npm install` and then `node server.js` from the real-time-server directory to launch the application.)

This is an early, simple version with a large room to develop. For the backend and the two players' interactions, I used Copilot and Gemini to help me think through the programming logic.

## Design

### Inspiration

Synchronizing body and emotion is a big challenge for long-distance relationships or friendships. I love playing Pictionary with my friends and boyfriend in my spare time, but still feel there’s a delay in thought and action, and I wondered what it would be like if both people were drawing and guessing at the same time.

“Folding” is a great concept that generates many beautiful art forms, like accordion folds / concertina folds (Fig.1) for books and comics, the *Folding Surprise* (Fig.2) drawing game for kids, and the Japanese *折本 (orihon)* (Fig.3) format for manga. I wanted to combine this idea of folding to create an interactive game.

<p align="center">
  <figure style="display:inline-block; text-align:center; margin:10px;">
    <img src="https://geechungdesign.com/case-studies/images/iasiaworks/iasiaworks-05.jpg" width="300">
    <figcaption>Fig.1. Accordion folds / concertina folds</figcaption>
  </figure>
  <figure style="display:inline-block; text-align:center; margin:10px;">
    <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQbTFqt-vUvxMRIIGCnc1sWR8tLNKcuxGlWpA&s" width="300">
    <figcaption>Fig.2. Folding Surprise </figcaption>
  </figure>
  <figure style="display:inline-block; text-align:center; margin:10px;">
    <img src="https://livedoor.sp.blogimg.jp/m_kanata/imgs/9/b/9ba82789.jpg" width="80%">
    <figcaption>Fig.3. 折本 (orihon)</figcaption>
  </figure>
</p>

### Interaction Flow
1. Setup
    On the Welcome page, players can join the game by entering their names, selecting their location, and uploading their avatar. When both click **Ready**, they will enter the canvas.

2. Drawing

    The canvas is divided by a dashed line. Each player can only see 1/4 part of the other’s side as a little hint. They have one minute to draw with brushes, adjust color and opacity, and use tools placed around the interface:

-   Brush, eraser, and palette on the top-right toolbar
-   Sliders for brush size and opacity on the left
-   Buttons to clear or save on the bottom right

    When time is up, the two drawings are joined and revealed on the screen.

## Unsolved Problems & Future Development

My original idea was to name it “Where Lines Meet.” I imagined the overlapping lines could generate effects like glowing or sampling their shapes to create something new (e.g. if both players drew a flower and defined it as a sample, little flowers might bloom where their lines connect). But in this version, I only managed to overlap two canvases in real time and didn’t have enough time to add these generative effects.

I’m fascinated by the possibilities, philosophy, and psychology behind 'folding'. In the future, I’d love to explore two approaches:

1. ***Folding Surprise* method**: Divide the canvas into four sections (A, B, C, D); player A draws in A & D, while player B draws in B & C (refer to Fig.2).

2. ***Orihon (折本) *method**: Divide the canvas into 1–8 connected panels, inviting more players to draw a continuous, unfolding story (refer to Fig.3).


**What Can Be Expanded:**

1. Location-based play: If location data could be applied (e.g. the player closer to the North Pole gets warmer palettes), it could add an emotional layer to the drawing experience.

2. UI: The visual style and interaction design could be more expressive and poetic. Brushes and the palette can have more choices. 

3. Player information: I want players to see each other’s info at the top-left corner, but this part hasn’t been figured out yet.

4. There’s still a bug when the two drawings are joined as the final merged image doesn’t align perfectly, so this part still needs fixing.

