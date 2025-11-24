# Final Project Proposal - Light Painting Tool in Generative Depth Space

## Concept Overiew

I plan to create a real-time light-painting tool where users can “step into” a 2D image and create long-exposure style light paintings within the image’s generative depth.

The core idea is to treat light as both a drawing medium and a way of revealing spatial layers inside a flat image. As users move in space, their bodies navigate through depth layers, and their hands “paint” with light that interacts differently with each layer.

## Inspirations

**1. Long-exposure Light Painting Photography** 

Moving light sources leave trails, glows, and accumulated traces over time. This technique turns temporal motion into spatial marks, allowing light to behave like a drawing tool. I am inspired by how these long-exposure aesthetics turn motion into visible marks.

<img src="https://thumbs.dreamstime.com/b/unique-creative-light-painting-fire-tube-lighting-creative-light-painting-fire-tube-lighting-116036292.jpg" height=200 width=300>  <img src="https://shotkit.com/wp-content/uploads/2020/10/light-painting-featured.jpg" height=200 width=300>  <img src="https://images.squarespace-cdn.com/content/v1/53a2b3a1e4b0a5020bebe676/1613040664494-KSL9I0P5QW9FTHMA5LCY/light-painting-photography-ideas-and-tips-2.jpg" height=200 width=300>

**2. 2D-to-3D Depth Reconstruction**

This technique infers depth from a single image allow a flat photo to unfold into layered space.

<img src="https://miro.medium.com/v2/resize:fit:1400/1*8qbMneRHrz6dSGhARoBZzw.png" height=200 width=400>  

## Technical Considerations

I will develop the project in Processing or p5.js, and use a Kinect sensor for body tracking.

**1. Pseudo-Depth Generation from 2D Image**

A depth-generation algorithm will transform an uploaded 2D image into a pseudo-3D depth field. “Pseudo-depth” means synthetic depth inferred for flat images that do not come with depth data.

The scene will be segmented into several depth zones, for example:

- Foreground

- Near midground

- Far midground

- Background

These layers will be used both visually (different treatment of light) and interactively (which layer is affected by the user).

**2. Depth–Light Matching Algorithm**

I will also design a depth–light matching algorithm that controls how light behaves in each depth layer, triggered by the viewer’s position and motion.

- **Body distance from the sensor:** selects or blends between depth layers

- **Hand position and motion:** acts as a moving light source

- **Depth layer color and texture:** influence the generated light color, scattering, and blending mode

In photography, long-exposure of lights can create effects such as:

- Ribbon-like curved light trails

- Glow effects with soft edges

- Motion blur trails / afterimages

- Starburst / beam flares

- Light fog / haze / volumetric glow

I plan to write algorithms that generate these effects based on:

- Viewers' distance (viewer depth → which layer / how strong)

- Movements' speed

- Depth layer' s color

- Direction of motion

The user’s hand functions as the primary light source, while their overall body distance determines which depth layer is being illuminated or painted on.

## Design Considerations

**1. User Interaction**

Stepping closer or farther from the installation moves the user through the image’s depth layers.

Hand movement creates light trails that mimic long-exposure photographic aesthetics:

- streaks

- glows

- bursts

- fades

ripples or wave-like modulations

Users effectively “walk into” the image and sculpt light inside its spatial structure.

**2. User Experience**

I want the experience to feel like: “Stepping into an image and leaving behind traces of your presence in light.”

The tool should be:

- Immediate: users see a direct response as they move.

- Understandable: closer = “inside” the scene, farther = “outside” or background.

- Expressive: small changes in motion should produce different visual qualities.

**3. Aesthetics**

The visuals will be composed to reveal the image’s unfolded spatial layers.

Each depth layer can have distinct light behavior (e.g., sharp trails in foreground, hazy glows in background).

## Successful Result

A successful outcome will be a real-time interactive installation where:

- Users can upload an image.

- Stand in front of the Kinect sensor.

- Move their bodies to navigate through depth layers.

- Use their hand as a light source to paint inside the scene.

Light traces should respond differently across depth layers in real time, making the spatial structure of the image perceptible and modifiable through interaction.

## Challenges

- Generating usable pseudo-depth from arbitrary images.

- Designing clear and meaningful depth layers.

- Mapping user movement to the correct depth layer.

- Ensuring Kinect tracking integrates smoothly with the depth field.

- Maintaining real-time performance while rendering accumulated light effects.