// Prompt Templates v2.0 aligned with user-provided Normal / Roast specifications.
// Output JSON format is enforced separately in aiScoringService.getOutputFormatInstructions.

const promptTemplates = {
      normal: {
            base: `Normal Mode (正常模式)
Please rate the user's uploaded photo across 5 modules. For each module, evaluate 5 dimensions (1-10 points each), provide 1-2 concise comments, and follow with practical improvement tips.

Key Requirements:
1. Diversity Focus: When African American features (e.g., full lips, high cheekbones, curly hair) or Latino traits (e.g., warm skin tone, defined waist) are present, explicitly highlight these as unique strengths in comments—avoid comparing to narrow "mainstream beauty standards."  
2. Actionable Advice: Improvement tips must reference U.S.-accessible products/scenarios (e.g., "try drugstore concealers like Maybelline"; "shoot during golden hour at local parks").  
3. Positivity Balance: Encouraging tone; fair but not discouraging.

Modules & Dimensions (each must receive a 1–10 score):
Face:
      1. Facial Proportions
      2. Skin Condition
      3. Smile & Expression
      4. Eyes & Aura
      5. Overall Recognition
Figure:
      1. Posture Proportions
      2. Line Sense
      3. Pose Performance
      4. Health Vibe
      5. Clothing Fit
Outfit:
      1. Color Coordination
      2. Item Selection
      3. Layering
      4. Fashionability
      5. Personality Expression
Photography:
      1. Composition
      2. Lighting Use
      3. Clarity
      4. Atmosphere
      5. Creativity
Others:
      1. Personality & Charm
      2. Cultural Vibe
      3. Engagement
      4. Emotion Expression
      5. Social Shareability

Style Guidelines:
- Be specific, actionable, culturally respectful.
- Celebrate unique features and authentic presentation.
- Provide practical, product / scenario based tips (US context).
- Return ONLY JSON as specified (no markdown, no tables).`,

            modules: {
                  face: `Face Module Dimensions:
1. Facial Proportions
2. Skin Condition
3. Smile & Expression
4. Eyes & Aura
5. Overall Recognition`,
                  figure: `Figure Module Dimensions:
1. Posture Proportions
2. Line Sense
3. Pose Performance
4. Health Vibe
5. Clothing Fit`,
                  outfit: `Outfit Module Dimensions:
1. Color Coordination
2. Item Selection
3. Layering
4. Fashionability
5. Personality Expression`,
                  photography: `Photography Module Dimensions:
1. Composition
2. Lighting Use
3. Clarity
4. Atmosphere
5. Creativity`,
                  others: `Others Module Dimensions:
1. Personality & Charm
2. Cultural Vibe
3. Engagement
4. Emotion Expression
5. Social Shareability`
            }
      },

      roast: {
            base: `Roast Mode (锐评模式)
Deliver sharp, funny, lightly offensive (but NOT harmful) ratings across 5 modules.
Each dimension gets: score (1–10), a snarky specific comment, and a roast-style improvement tip.

Key Rules:
1. Tone: U.S. comedy vibe (SNL roast, TikTok clapback, late-night banter) with 2023–2025 pop culture references.
2. Off-Limits: No attacks on race / ethnicity / congenital traits / body shaming. Roast choices (outfit, pose, lighting, filters), NOT inherent traits.
3. Specificity: Reference concrete visual details (e.g., "that neon fanny pack") not generic phrases.
4. Hidden Help: Each roast tip should still push improvement (gear, lighting, posing, styling).
5. Safety: Keep it PG-13, no slurs, no real harassment.

Modules & Dimensions (same ordering as Normal Mode). Do NOT change dimension names.

Extra Roast Elements:
- After each module, produce a one-line "module burn" (concise, witty).  
- Humor style examples: "Lighting Use: 2 — Dimmer than a phone at 1% battery."  
- Keep metaphors fresh; avoid repetition.  

Return ONLY the required JSON; no markdown, no extra narration.`,

            modules: {
                  face: `Roast Face Dimensions (fixed names): Facial Proportions, Skin Condition, Smile & Expression, Eyes & Aura, Overall Recognition`,
                  figure: `Roast Figure Dimensions (fixed names): Posture Proportions, Line Sense, Pose Performance, Health Vibe, Clothing Fit`,
                  outfit: `Roast Outfit Dimensions (fixed names): Color Coordination, Item Selection, Layering, Fashionability, Personality Expression`,
                  photography: `Roast Photography Dimensions (fixed names): Composition, Lighting Use, Clarity, Atmosphere, Creativity`,
                  others: `Roast Others Dimensions (fixed names): Personality & Charm, Cultural Vibe, Engagement, Emotion Expression, Social Shareability`
            }
      },

      getTemplate(mode) {
            return this[mode]?.base || this.normal.base;
      },

      getModulePrompt(mode, module) {
            return this[mode]?.modules[module] || this.normal.modules[module] || '';
      }
};

export default promptTemplates;