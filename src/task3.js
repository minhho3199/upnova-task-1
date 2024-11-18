const UPEZ_INNER_DRAWER_CONTAINER = "upez--inner-drawer-container";

const flattenData = (data) => {
  return data.flatMap((item) => {
    const { children, ...itemWithoutChildren } = item;
    if (itemWithoutChildren.class === "upez--cart-item") {
      return [itemWithoutChildren, ...flattenData(itemWithoutChildren.component.options.symbol.content.data.blocks)];
    }
    if (children && Array.isArray(children)) {
      return [itemWithoutChildren, ...flattenData(children)];
    }
    return [itemWithoutChildren];
  });
};

function findById(data, id) {
  for (const item of data) {
    if (item.id === id) {
      return item;
    }
    if (item.children && Array.isArray(item.children)) {
      const found = findById(item.children, id);
      if (found) return found;
    }
  }
  return null;
}

const getSettingId = (value) => {
  const match = value.match(/state\.getSettingValue\(\\['"]([^'"]+)\\['"]/);
  if (!match) return;
  return match[1];
};

const mapStyleBindingsToSettings = (bindings) => {
  const remappedStyleBindings = {};
  for (const [key, value] of Object.entries(bindings)) {
    if (key.startsWith("style.")) {
      const settingName = getSettingId(JSON.stringify(value));
      if (!settingName) continue;
      const styleKey = key.replace("style.", "");
      remappedStyleBindings[styleKey] = settingName;
    }
  }
  return new Map(Object.entries(remappedStyleBindings));
};

const allChildren = flattenData(window.UPEZ_BUILDER_DATA["8c22b490d74c4be8840ebf9c8add7012"][0].data.blocks);

const childrenWithBindings = allChildren.filter((child) => child.bindings || child.meta?.bindingActions);

const builderIds = childrenWithBindings.map((child) => child.id);

const settingsMap = new Map(
  window.UPEZ_BUILDER_DATA["8c22b490d74c4be8840ebf9c8add7012"][0].data.settings.map((setting) => [
    setting.id,
    setting.label,
  ])
);
// Add tooltip styles
const highlightStyle = document.createElement("style");
highlightStyle.innerHTML = `
  .highlight-inspect {
    outline: 2px solid rgba(0, 150, 255, 0.7);
    background-color: rgba(0, 150, 255, 0.1) !important;
    cursor: pointer;
  }
  .custom-tooltip {
    position: absolute;
    color: white;
    padding: 5px 10px;
    font-size: 12px;
    pointer-events: auto;
    z-index: 99999999;
    white-space: nowrap;
    background-color: rgba(0, 150, 255, 1);
    border: 2px solid rgba(0, 150, 255, 0.7);
    box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
    transform: translateY(-100%);
    transition: 0.2s;
  }
  .custom-tooltip:hover {
    background-color: white !important;
    color: rgba(0, 150, 255, 1);
    cursor: pointer;
  }
`;
document.head.appendChild(highlightStyle);

// Create the tooltip element
const tooltip = document.createElement("div");
tooltip.className = "custom-tooltip";
tooltip.style.display = "none"; // Initially hidden
document.body.appendChild(tooltip);

let currentElement = null;
const container = document.querySelector(`.${UPEZ_INNER_DRAWER_CONTAINER}`);
if (!container) {
  throw new Error("upez--inner-drawer-container not found");
}

const drawerContainerSettings = allChildren.find((child) => child.class === UPEZ_INNER_DRAWER_CONTAINER);
const styleBindings = mapStyleBindingsToSettings(drawerContainerSettings?.bindings);
// Add mousemove listener for hover effects
container.addEventListener("mousemove", (e) => {
  const target = e.target;

  // Check if the element has a "builder-id" attribute
  const builderId = target.getAttribute("builder-id") || target.closest(".builder-block")?.getAttribute("builder-id");

  const builderComponent = findById(childrenWithBindings, builderId);

  const componentSettingId = getSettingId(JSON.stringify(builderComponent));
  if (currentElement === target || !builderIds.includes(builderId) || !componentSettingId) {
    return;
  }

  if (currentElement) {
    currentElement.classList.remove("highlight-inspect");
  }

  currentElement = target;
  currentElement.classList.add("highlight-inspect");

  // Update tooltip content
  tooltip.textContent = settingsMap.get(componentSettingId);
  tooltip.setAttribute("component-setting-id", componentSettingId);

  // Get the position of the target element
  const rect = target.getBoundingClientRect();
  const tooltipWidth = tooltip.offsetWidth;

  // Default position: aligned to the left and directly above the element
  let left = rect.left - 3;

  // Check for out-of-bounds (right)
  if (left + tooltipWidth > window.innerWidth) {
    left = window.innerWidth - tooltipWidth - 15;
  }

  // Apply the adjusted position
  tooltip.style.display = "block";
  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${rect.top}px`;
});

// Ensure hover effect persists when hovering over the tooltip
document.addEventListener("mouseout", (e) => {
  if (e.relatedTarget === tooltip || (currentElement && currentElement.contains(e.relatedTarget))) {
    return;
  }

  if (currentElement) {
    currentElement.classList.remove("highlight-inspect");
    currentElement = null;
  }
  tooltip.style.display = "none";
});

// Add click functionality to the tooltip
tooltip.addEventListener("click", () => {
  console.log(`You clicked on: ${tooltip.getAttribute("component-setting-id")}`);
});
