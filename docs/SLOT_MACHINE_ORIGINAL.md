# Original Asymptopia Slot Machine

Source: https://github.com/ccosse/slotmachine
Reference: https://www.asymptopia.com/slotmachine/#/

The homepage uses the owner's original five-reel Quasar/Vue source, now extended to seven reels, not an invented WELCOME animation.

Integration-only modifications:
- Alias imports changed to relative paths.
- Top-level q-page wrapper replaced with positioned div because the Astro homepage is not a Quasar layout.
- Remote image URLs switched to copies of the *same* original images stored under public/images/slot/.
- Original global html/body height rule scoped to the embedded component.
- QBtn and QImg registered through Astro's Vue application entrypoint.

Preserved: five reels, twenty 18-degree faces per reel, 700px stage, green stage / orange controls, five-second rotation cycle, Spin and Wait controls, clock-based stop timing, numerical results, and confetti. The original author notes that the clock-based stop can be inaccurate on slower computers; this behavior is intentionally unchanged.

The seven-letter WELCOME and the earlier Reading Edge reinterpretation were removed from the homepage and source, and remain recoverable from Git history.

Browser rendering and behavior must still be compared with the reference deployment.

## Seven-reel change

Two reels have been added, preserving the same 20 symbols, 18-degree panes, five-second spin cycle and existing stop algorithm. Image offsets continue with 15 and 18 positions. Reels are now spaced at eighths of the unchanged stage width. Numerical results include all seven reels, and confetti starts after the seventh stops. No WELCOME letters have been added.

## One letter per reel (WELCOME)

Each reel shows its assigned letter on face 0, W E L C O M E left to right. The original 20-symbol image arrays are retained unchanged; the corresponding face displays the letter in place of its original graphic. The reel animation and staggered stopping delays remain. Each reel aligns to face 0 at its usual stop, and the numerical results display reports the landed index 0. Spin clears that alignment for the next run. No extra sections or text were added.
