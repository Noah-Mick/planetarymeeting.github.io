/**
 * Single source of truth for every piece on the site.
 *
 * Each entry:
 *   title  - shown in the lightbox caption and used as the img alt text
 *   file   - filename inside images/<section>/
 *   src    - original URL on the WordPress site, kept only so
 *            scripts/download-images.js can re-fetch or update a piece later.
 *            Nothing on the live site reads it.
 *
 * To add a piece: drop the file in the right images/ folder and add a row here.
 * Order in this file is the order it appears in the gallery.
 */
window.ARTWORK = {
  illustration: [
    { title: "A Day Spent Outside", file: "A-Day-Spent-Outside.png", src: "https://planetarymeeting.com/wp-content/uploads/2025/02/A-Day-Spent-Outside.png" },
    { title: "What More is There to Do", file: "What-More-is-There-to-Do.jpg", src: "https://planetarymeeting.com/wp-content/uploads/2025/02/What-More-is-There-to-Do.jpg" },
    { title: "What's in your Palette", file: "Whats-in-your-Palette.png", src: "https://planetarymeeting.com/wp-content/uploads/2025/02/Whats-in-your-Palette.png" },
    { title: "Snow Dogs", file: "Snow-Dogs.png", src: "https://planetarymeeting.com/wp-content/uploads/2025/02/Snow-Dogs.png" },
    { title: "In a Forest", file: "In-a-Forest.png", src: "https://planetarymeeting.com/wp-content/uploads/2025/02/In-a-Forest.png" },
    { title: "For What It's Worth", file: "For-What-Its-Worth.png", src: "https://planetarymeeting.com/wp-content/uploads/2025/01/For-What-Its-Worth.png" },
    { title: "Wrapped in The Wave", file: "Wrapped-in-The-Wave.jpg", src: "https://planetarymeeting.com/wp-content/uploads/2024/12/Wrapped-in-The-Wave.jpg" },
    { title: "CYCLOPS ROSÈ", file: "CYCLOPS-ROSE.png", src: "https://planetarymeeting.com/wp-content/uploads/2025/02/CYCLOPS-ROSE.png" },
    { title: "CYCLOPS WHITE", file: "CYCLOPS-WHITE.jpg", src: "https://planetarymeeting.com/wp-content/uploads/2025/02/CYCLOPS-WHITE.jpg" },
    { title: "CYCLOPS RED", file: "CYCLOPS-RED.png", src: "https://planetarymeeting.com/wp-content/uploads/2025/02/CYCLOPS-RED.png" },
    { title: "The End Of Snow Days", file: "The-End-Of-Snow-Days.png", src: "https://planetarymeeting.com/wp-content/uploads/2025/02/The-End-Of-Snow-Days.png" },
    { title: "The Library Bathroom", file: "The-Library-Bathroom.png", src: "https://planetarymeeting.com/wp-content/uploads/2025/02/The-Library-Bathroom-e1740447523851.png" },
    { title: "The Library Bathroom Double Page Spread", file: "The-Library-Bathroom-Double-Page-Spread.png", src: "https://planetarymeeting.com/wp-content/uploads/2025/02/The-Library-Bathroom-Double-Page-Spread.png" },
    { title: "Java Burrito Company Illustration", file: "Java-Burrito-Company-Illustration.png", src: "https://planetarymeeting.com/wp-content/uploads/2025/02/Java-Burrito-Company-Illustration.png" },
    { title: "The Alchemist Book Cover Mockup", file: "The-Alchemist-Book-Cover-Mockup.png", src: "https://planetarymeeting.com/wp-content/uploads/2025/02/The-Alchemist-Book-Cover-Mockup.png" },
    { title: "Heinz Endelmann Inspired Tame Impala Poster", file: "Heinz-Endelmann-Inspired-Tame-Impala-Poster.png", src: "https://planetarymeeting.com/wp-content/uploads/2025/02/Heinz-Endelmann-Inspired-Tame-Impala-Poster.png" },
    { title: "Another Jar for my Things", file: "Another-Jar-for-my-Things.png", src: "https://planetarymeeting.com/wp-content/uploads/2025/02/Another-Jar-for-my-Things.png" },
    { title: "Mr. Pig Heads on Over to the Sea Store", file: "Mr-Pig-Heads-on-Over-to-the-Sea-Store.jpg", src: "https://planetarymeeting.com/wp-content/uploads/2025/02/Mr.-Pig-Heads-on-Over-to-the-Sea-Store.jpg" },
    { title: "The Monster Under My Bed", file: "The-Monster-Under-My-Bed.png", src: "https://planetarymeeting.com/wp-content/uploads/2025/02/The-Monster-Under-My-Bed.png" }
  ],

  sketchbook: [
    { title: "Photo Nov 28 2023, 6 55 59 PM", file: "Photo-Nov-28-2023-6-55-59-PM.jpg", src: "https://planetarymeeting.com/wp-content/uploads/2025/02/Photo-Nov-28-2023-6-55-59-PM.jpg" },
    { title: "Photo Nov 27 2023, 5 38 25 PM", file: "Photo-Nov-27-2023-5-38-25-PM.jpg", src: "https://planetarymeeting.com/wp-content/uploads/2025/02/Photo-Nov-27-2023-5-38-25-PM.jpg" },
    { title: "Photo Aug 02 2024, 9 04 06 AM", file: "Photo-Aug-02-2024-9-04-06-AM.jpg", src: "https://planetarymeeting.com/wp-content/uploads/2025/02/Photo-Aug-02-2024-9-04-06-AM.jpg" },
    { title: "Photo Dec 07 2024, 12 55 34 PM", file: "Photo-Dec-07-2024-12-55-34-PM.jpg", src: "https://planetarymeeting.com/wp-content/uploads/2025/02/Photo-Dec-07-2024-12-55-34-PM.jpg" },
    { title: "Photo Dec 11 2024, 10 23 46 AM", file: "Photo-Dec-11-2024-10-23-46-AM.jpg", src: "https://planetarymeeting.com/wp-content/uploads/2025/02/Photo-Dec-11-2024-10-23-46-AM.jpg" },
    { title: "Photo Sep 12 2023, 5 00 36 PM", file: "Photo-Sep-12-2023-5-00-36-PM.jpg", src: "https://planetarymeeting.com/wp-content/uploads/2025/02/Photo-Sep-12-2023-5-00-36-PM.jpg" },
    { title: "mind 2", file: "mind-2.png", src: "https://planetarymeeting.com/wp-content/uploads/2025/02/mind-2.png" },
    { title: "Mind", file: "Mind.png", src: "https://planetarymeeting.com/wp-content/uploads/2025/02/Mind.png" },
    { title: "Head Split", file: "Head-Split.png", src: "https://planetarymeeting.com/wp-content/uploads/2025/01/Head-Split-378501114-e1737405504743.png" },
    { title: "Photo Dec 29 2024, 2 11 52 PM", file: "Photo-Dec-29-2024-2-11-52-PM.jpg", src: "https://planetarymeeting.com/wp-content/uploads/2025/02/Photo-Dec-29-2024-2-11-52-PM.jpg" },
    { title: "Photo Dec 07 2024, 1 02 14 PM", file: "Photo-Dec-07-2024-1-02-14-PM.jpg", src: "https://planetarymeeting.com/wp-content/uploads/2025/02/Photo-Dec-07-2024-1-02-14-PM.jpg" },
    { title: "Photo Dec 07 2024, 1 01 35 PM", file: "Photo-Dec-07-2024-1-01-35-PM.jpg", src: "https://planetarymeeting.com/wp-content/uploads/2025/02/Photo-Dec-07-2024-1-01-35-PM.jpg" },
    { title: "Photo Jul 15 2024, 2 42 43 PM", file: "Photo-Jul-15-2024-2-42-43-PM.jpg", src: "https://planetarymeeting.com/wp-content/uploads/2025/02/Photo-Jul-15-2024-2-42-43-PM.jpg" },
    { title: "Photo Dec 11 2024, 9 51 31 PM", file: "Photo-Dec-11-2024-9-51-31-PM.jpg", src: "https://planetarymeeting.com/wp-content/uploads/2025/02/Photo-Dec-11-2024-9-51-31-PM.jpg" },
    { title: "Gone FIshin'", file: "Gone-Fishin.png", src: "https://planetarymeeting.com/wp-content/uploads/2025/01/Gone-FIshin-3141637338-e1737405558953.png" },
    { title: "Photo Jun 01 2023, 5 54 14 PM", file: "Photo-Jun-01-2023-5-54-14-PM.jpg", src: "https://planetarymeeting.com/wp-content/uploads/2025/02/Photo-Jun-01-2023-5-54-14-PM.jpg" },
    { title: "Photo Feb 11 2025, 6 42 30 PM", file: "Photo-Feb-11-2025-6-42-30-PM.jpg", src: "https://planetarymeeting.com/wp-content/uploads/2025/02/Photo-Feb-11-2025-6-42-30-PM.jpg" },
    { title: "Photo Dec 07 2024, 12 55 07 PM", file: "Photo-Dec-07-2024-12-55-07-PM.jpg", src: "https://planetarymeeting.com/wp-content/uploads/2025/02/Photo-Dec-07-2024-12-55-07-PM.jpg" },
    { title: "Photo Jul 15 2024, 2 42 11 PM", file: "Photo-Jul-15-2024-2-42-11-PM.jpg", src: "https://planetarymeeting.com/wp-content/uploads/2025/02/Photo-Jul-15-2024-2-42-11-PM.jpg" },
    { title: "Severed or Connected", file: "Severed-or-Connected.png", src: "https://planetarymeeting.com/wp-content/uploads/2025/01/Severed-or-Connected-270729605-e1737405630196.png" },
    { title: "Photo Sep 10 2024, 9 20 59 AM", file: "Photo-Sep-10-2024-9-20-59-AM.jpg", src: "https://planetarymeeting.com/wp-content/uploads/2025/02/Photo-Sep-10-2024-9-20-59-AM.jpg" },
    { title: "Two People", file: "Two-People.png", src: "https://planetarymeeting.com/wp-content/uploads/2025/02/Two-People.png" },
    { title: "Photo Jul 31 2023, 11 25 32 AM", file: "Photo-Jul-31-2023-11-25-32-AM.jpg", src: "https://planetarymeeting.com/wp-content/uploads/2025/02/Photo-Jul-31-2023-11-25-32-AM.jpg" },
    { title: "Photo Jun 25 2023, 12 20 55 PM", file: "Photo-Jun-25-2023-12-20-55-PM.jpg", src: "https://planetarymeeting.com/wp-content/uploads/2025/02/Photo-Jun-25-2023-12-20-55-PM.jpg" },
    { title: "Self Portrait", file: "Self-Portrait.png", src: "https://planetarymeeting.com/wp-content/uploads/2025/02/Self-Portrait.png" },
    { title: "Photo Nov 27 2024, 11 59 47 AM", file: "Photo-Nov-27-2024-11-59-47-AM.jpg", src: "https://planetarymeeting.com/wp-content/uploads/2025/02/Photo-Nov-27-2024-11-59-47-AM.jpg" },
    { title: "Photo Jul 15 2024, 2 42 31 PM", file: "Photo-Jul-15-2024-2-42-31-PM.jpg", src: "https://planetarymeeting.com/wp-content/uploads/2025/02/Photo-Jul-15-2024-2-42-31-PM.jpg" },
    { title: "Photo Sep 05 2024, 10 25 52 AM", file: "Photo-Sep-05-2024-10-25-52-AM.jpg", src: "https://planetarymeeting.com/wp-content/uploads/2025/02/Photo-Sep-05-2024-10-25-52-AM.jpg" },
    { title: "cyclops 2", file: "cyclops-2.png", src: "https://planetarymeeting.com/wp-content/uploads/2025/02/cyclops-2.png" },
    { title: "aligator man", file: "aligator-man.png", src: "https://planetarymeeting.com/wp-content/uploads/2025/02/aligator-man.png" },
    { title: "Photo Feb 24 2025, 8 46 23 PM", file: "Photo-Feb-24-2025-8-46-23-PM.jpg", src: "https://planetarymeeting.com/wp-content/uploads/2025/02/Photo-Feb-24-2025-8-46-23-PM.jpg" },
    { title: "Horse", file: "Horse.png", src: "https://planetarymeeting.com/wp-content/uploads/2025/02/Horse.png" }
  ],

  "fine-art": [
    { title: "Desires of Earth", file: "Desires-of-Earth.png", src: "https://planetarymeeting.com/wp-content/uploads/2025/02/Desires-of-Earth.png" },
    { title: "Aquarius", file: "aquarius.png", src: "https://planetarymeeting.com/wp-content/uploads/2025/02/aquarius.png" },
    { title: "Bath Time", file: "Bath-Time.png", src: "https://planetarymeeting.com/wp-content/uploads/2025/02/Bath-Time.png" },
    { title: "Forsyth Fountain", file: "Forsyth-Fountain.png", src: "https://planetarymeeting.com/wp-content/uploads/2025/02/Forsyth-Fountain.png" },
    { title: "River Street", file: "River-Street.png", src: "https://planetarymeeting.com/wp-content/uploads/2025/02/River-Street.png" },
    { title: "SCAD Theater", file: "SCAD-Theater.png", src: "https://planetarymeeting.com/wp-content/uploads/2025/02/SCAD-Theater.png" }
  ],

  // Not a gallery — the logo and the About portrait. Kept here so the
  // download script picks them up alongside everything else.
  site: [
    { title: "Planetary Meeting", file: "logo.png", src: "https://planetarymeeting.com/wp-content/uploads/2025/01/cropped-Untitled_Artwork-1-e1737514381184.png" },
    { title: "Livia Burkhardt", file: "portrait.png", src: "https://planetarymeeting.com/wp-content/uploads/2025/02/Photo-Aug-27-2024-4-59-04-PM-e1740450788794.png" }
  ]
};
