// Per-exercise motion cues for Wan 2.2 T2V. The framing prefix/suffix keep every
// clip consistent (single athlete, plain studio, full body, loopable). The core
// cue describes the actual movement so the model gets the FORM right.
//
// This program is home/household-friendly: a chair, couch, wall, towel, paper
// plates, and water bottles are allowed (found in every home). Cues name the
// item where the original move used one.

export const FRAMING_PREFIX =
  'Solo home-fitness demonstration video. Exactly ONE person, a single fit athletic person completely alone in an empty studio, no one else in frame, performing ';

export const FRAMING_SUFFIX =
  ', entire body fully visible head to toe, perfect controlled exercise form, repeating the movement at a steady pace, plain light-gray seamless studio background, soft even studio lighting, slight depth of field, photorealistic, high detail, smooth natural motion, seamless loop, 30fps fitness reference clip.';

export const NEGATIVE =
  'two people, 2 people, second person, multiple people, duplicate person, twins, clone, overlapping bodies, extra person, crowd, reflection, mirror image, ' +
  'blurry, low quality, distorted anatomy, bad anatomy, extra limbs, extra arms, extra legs, extra fingers, fused fingers, deformed, mutated, malformed body, ' +
  'text, captions, subtitles, watermark, logo, jittery, glitch, morphing body, body horror, cartoon, anime, 3d render artifacts, oversaturated, cropped body, face closeup only, machines.';

// Motion cues keyed by the exercise id used for the S3 filename.
export const CUES = {
  // Chest
  'traditional-push-up': 'classic push-ups on the floor, hands shoulder-width apart, body in a straight line, lowering the chest toward the floor then pressing back up, side view',
  'wide-push-up': 'wide-grip push-ups, hands placed wider than the shoulders, lowering the chest and pressing up, side view',
  'diamond-push-up': 'diamond push-ups with both hands together forming a triangle under the chest, elbows tucked, lowering and pressing up, side view',
  'incline-push-up': 'incline push-ups with both hands resting on the edge of a couch, body straight, lowering the chest to the couch and pressing up, side view',
  'decline-push-up': 'decline push-ups with both feet elevated on a couch and hands on the floor, lowering the chest down and pressing up, side view',
  'fly-slides': 'a kneeling chest fly with both hands on paper plates on a smooth floor, sliding the hands out wide to the sides then squeezing the chest to pull them back together, side-front view',
  // Back
  'back-extensions': 'lying face down on the floor holding a towel taut overhead with both hands, lifting the chest while pulling the towel apart and down toward the upper back, then reaching the arms back overhead, side-front view',
  'supermans': 'superman exercise lying face down, simultaneously raising both arms and legs off the floor then lowering, side view',
  'hindu-push-ups': 'hindu push-ups, flowing from downward-dog into a sweeping dive forward to upward facing cobra and back, side view',
  'lat-slides': 'kneeling with both hands on paper plates on a smooth floor, sliding both arms forward overhead to stretch the lats then pulling back to engage the back, side view',
  // Shoulders
  'pike-push-up': 'pike push-ups in an inverted V position, hips high, lowering the top of the head toward the floor and pressing up, side view',
  'pulling-lat-raise': 'standing self-resisted lateral raise, the hands clasped and pressing together in front of the chest, raising the bent elbows up and out to the sides to shoulder height and lowering with control, front view',
  'tomahawk-shoulder-raise': 'standing shoulder raise holding a water bottle in each hand, sweeping both arms from the front up overhead in a smooth chopping arc and lowering back down, front view',
  'front-raise': 'standing front raise holding a water bottle in each hand, lifting both arms straight forward to shoulder height and lowering with control, front view',
  'y-up-to-pull-down': 'standing, holding a towel wide overhead in a Y shape, pulling the towel down behind the head into a W by driving the elbows down, then pressing back up, front view',
  // Legs
  'timed-squats': 'bodyweight squats, feet shoulder-width, lowering hips down to parallel and standing back up, side view',
  'wall-sits': 'wall sit holding a seated position with the back flat against a wall and thighs parallel to the floor, side view',
  'alternating-reverse-lunge': 'alternating reverse lunges, stepping one leg back into a lunge and returning, alternating legs, side view',
  'isolated-lunge-pulse': 'isolated lunge pulses, holding a deep lunge and pulsing up and down a small range, side view',
  'alternating-curtsy-lunge': 'alternating curtsy lunges, stepping one leg diagonally behind the other into a curtsy and returning, alternating, front view',
  'isolated-curtsy-lunge-pulse': 'isolated curtsy lunge pulses, holding a curtsy lunge and pulsing up and down, front view',
  'hip-thrusts': 'glute hip thrusts with the upper back resting on the edge of a couch and feet flat on the floor, driving the hips up to full extension and lowering, side view',
  // Upper Body HIIT
  'plank-jacks': 'plank jacks in a forearm plank, jumping both feet out wide and back together, side view',
  'crawl-outs': 'crawl-outs, standing then walking the hands out to a plank and back to standing, side view',
  'plank-oblique-hops': 'plank oblique hops in a high plank, hopping both feet to one side and then the other, side view',
  'plank-toe-taps': 'plank toe taps in a high plank, tapping one foot out to the side and back, alternating, side view',
  // Lower Body HIIT
  'alternating-side-lunges': 'alternating side lunges, stepping wide to one side bending that knee while the other leg stays straight, alternating, front view',
  'lunge-jumps': 'jumping lunges, exploding up from a lunge and switching legs in the air, side view',
  'low-in-out-squats': 'low in-and-out squats staying in a low squat, jumping the feet wide then narrow, front view',
  'jump-squats': 'explosive jump squats, squatting down then jumping straight up and landing softly, side view',
  // Cardio HIIT
  'high-knees': 'high knees running in place, driving the knees up to hip height quickly, front view',
  'jumping-jacks': 'jumping jacks, jumping the feet out while raising the arms overhead and back, front view',
  'burpees': 'burpees, squatting down to the floor, kicking back to a plank, returning and jumping up with arms overhead, side view',
  'mountain-climbers': 'mountain climbers in a high plank, driving the knees toward the chest quickly alternating, side view',
  // Grow Like Game
  'plank-push-ups': 'plank-to-push-up up-downs, moving from forearm plank up to a high plank one arm at a time and back down, side view',
  'isolated-chest-hold-oblique-toe-taps': 'holding the bottom of a push-up near the floor while tapping alternating toes out to the sides, side view',
  'scapular-holds-wide-push-up': 'wide push-up with a scapular hold at the top, squeezing the shoulder blades together, side view',
  'chair-dips': 'tricep dips with both hands on the edge of a sturdy chair, bending the elbows to lower the body and pressing back up, side view',
  // Abs Like Royce
  'squat-to-oblique-cross': 'squat to oblique crunch, squatting then standing and crunching one knee toward the opposite elbow, alternating, front view',
  'v-sit': 'V-sit hold balancing on the glutes with legs and torso lifted into a V shape, front view',
  'single-side-bicycle-crunch-isolations': 'single-side bicycle crunch, lying down twisting one elbow toward the opposite knee repeatedly, side view',
  'plank-slides': 'forearm plank with both feet on paper plates on a smooth floor, sawing the whole body forward and back while holding a tight plank, side view',
};

export const promptFor = (ex) => {
  const cue = CUES[ex.id] || `${ex.name.toLowerCase()} exercise with controlled form`;
  return FRAMING_PREFIX + cue + FRAMING_SUFFIX;
};
