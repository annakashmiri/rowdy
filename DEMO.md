# Showing Rowdy to colleagues (about 5 minutes)

## Before you start
- Open the **published Claude artifact link** (not the GitHub Pages copy) so the plain-language box works. The first time you press *Fill in the form*, Claude asks for permission. Say yes before the meeting so it does not interrupt the demo.
- Have the real sheet open in another window, on the Meta tab, scrolled to the first empty row.
- Know which row that is, and type it into the "Paste into row" box.

## The story (30 seconds)
"When we add a deal, we type the same details into four tabs, and every tab has different columns. It's slow, and the character-count formulas are easy to forget. Rowdy asks for the deal once."

## The demo
1. **Step 1.** Paste a real recent deal in plain words, for example:
   *"Boost weekend: 2 pizzas for RM25, delivery, code 123456, Fri to Sun, Meta and TikTok. A static and a video."*
   Press **Fill in the form**. Wait a few seconds.
2. **Step 2.** Point out that the form is filled and the "Worth a second look" note lists anything Claude was unsure about. Change one thing by hand to show it is editable. Type a long headline to show the red counter.
3. **Step 3.** Show the preview: blue columns are ours, purple are CoE's and stay blank, and over-limit copy is highlighted. Press **Copy**, switch to Excel, click the cell in column A, paste. Point at the character-count column: it is a live formula.
4. Turn on **Search** and **YouTube** to show that one deal gives a row for every tab.

## Say this honestly
- It produces rows to paste. It does not edit the sheet, because the sheet is shared.
- The next-empty-row number has to be checked by hand.
- Claude can misread a note, so people must review step 2 before copying. That is why the "second look" list exists.
- The plain-language box needs Claude. The form works without it.

## Likely questions
- **Does it save our data?** No. Nothing is stored. Only the text in step 1 is sent to Claude.
- **Can it write to the sheet directly?** Not this version. See "Ideas for next steps" in the README.
- **What if the sheet's columns change?** Run `tests/check_headers.py` and update the layout at the top of `index.html`.
