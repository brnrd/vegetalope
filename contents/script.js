const style = document.createElement("style");
const logoId = ".logo";
const colorPickerClass = ".color-picker";

document.head.appendChild(style);

const sheet = style.sheet;
const colorPicker = document.querySelector(colorPickerClass);

sheet.insertRule(`${logoId} {fill: #fd83b5;}`);
sheet.insertRule(`.square--odd.square--centodd {background-color: white;}`);
sheet.insertRule(`.square--odd.square--centeven {background-color: black;}`);
sheet.insertRule(`.square--even.square--centeven {background-color: white;}`);
sheet.insertRule(`.square--even.square--centodd {background-color: odd;}`);

colorPicker.addEventListener("change", (event) => {
  const color = event.target.value;
  console.info(color, event);

  updateFillRule(logoId, color);
});

let counter = 0;

// setInterval(() => {
//   if (counter % 2 === 0) {
//     updateBGRule(".square--even", "pink");
//     updateBGRule(".square--odd", "red");
//   } else {
//     updateBGRule(".square--even", "red");
//     updateBGRule(".square--odd", "pink");
//   }
//   counter++;
// }, 500);

function updateFillRule(rule, value) {
  console.info("rules", rule, value, sheet.cssRules);

  ruleItem = getRuleItem(rule);
  ruleItem.style.fill = value;
}

function updateBGRule(rule, value) {
  console.info("rules", rule, value, sheet.cssRules);

  ruleItem = getRuleItem(rule);
  ruleItem.style.backgroundColor = value;
}

function getRuleItem(rule) {
  if (!sheet.cssRules.length) return;

  for (ruleIndex in sheet.cssRules) {
    if (sheet.cssRules[ruleIndex].selectorText !== rule) continue;

    return sheet.cssRules[ruleIndex];
  }
}
