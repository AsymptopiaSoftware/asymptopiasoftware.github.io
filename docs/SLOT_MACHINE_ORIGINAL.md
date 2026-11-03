# Original Asymptopia Slot Machine

Source: https://github.com/ccosse/slotmachine
Reference: https://www.asymptopia.com/slotmachine/#/

The homepage uses the owner's original five-reel Quasar/Vue source, not an invented WELCOME animation.

Integration-only modifications:
- Alias imports changed to relative paths.
- Top-level q-page wrapper replaced with positioned div because the Astro homepage is not a Quasar layout.
- Remote image URLs switched to copies of the *same* original images stored under public/images/slot/.
- Original global html/body height rule scoped to the embedded component.
- QBtn and QImg registered through Astro's Vue application entrypoint.

Preserved: five reels, twenty 18-degree faces per reel, 700px stage, green stage / orange controls, five-second rotation cycle, Spin and Wait controls, clock-based stop timing, numerical results, and confetti. The original author notes that the clock-based stop can be inaccurate on slower computers; this behavior is intentionally unchanged.

The seven-letter WELCOME and the earlier Reading Edge reinterpretation were removed from the homepage and source, and remain recoverable from Git history.

Browser rendering and behavior must still be compared with the reference deployment.
