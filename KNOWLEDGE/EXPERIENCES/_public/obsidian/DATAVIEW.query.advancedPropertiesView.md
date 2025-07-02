



some guy create vault example
this exactly what we need
https://github.com/mdelobelle/metadatamenu/discussions/687#discussion-6766018
	
the vault itself
https://drive.google.com/drive/folders/1qDPt8bALMBfbXaGb_qKm6-Y1h42WOznF






initial guy . OG 
	THANK YOU
		https://forum.obsidian.md/u/fcskit/summary


way to display properties properly using dataview

https://forum.obsidian.md/t/properties-support-multi-level-yaml-nested-attributes/63826/84?u=beto

his code:
```jsx
const rootKey = "__root__";

if (input && dv) {
  const properties = dv.el("div", "", { cls: "note-properties", attr: { id: "properties-container" } });
  // Set up a tree-like dict of all the directory {path : ul element} mappings
  let listTree = {};
  let header = "Properties";
  let obj = {};
  const frontmatter = dv.current().file.frontmatter
  if (Object.keys(input).length === 0 && input.constructor === Object && frontmatter.hasOwnProperty("note type")) {
    const note_type = frontmatter["note type"];
    switch (note_type) {
      case "electrochemical cell":
        header = "Cell Properties";
        obj = frontmatter["cell"];
        break;
      case "device":
        header = "Device Properties";
        obj = frontmatter["device"];
        break;
      case "instrument":
        header = "Instrument Properties";
        obj = frontmatter["instrument"];
        break;
      case "chemical":
        header = "Chemical Properties";
        obj = frontmatter["chemical"];
        break;
      case "electrode":
        header = "Electrode Properties";
        obj = frontmatter["electrode"];
        break;
      case "reference electrode":
        header = "Reference Electrode Properties";
        obj = frontmatter["electrode"];
        break;
      case "process":
        header = "Process Properties";
        obj = frontmatter["process"];
        break;
      case "sample":
        header = "Sample Properties";
        obj = frontmatter["sample"];
        break;
      case "analysis":
        header = "Analysis Properties";
        obj = frontmatter["analysis"];
        break;
      case "lab":
        header = "Lab Properties";
        obj = frontmatter["lab"];
        break;
      default:
        obj = frontmatter;
    }
  }
  else {
    let key = "";
    // check if input has property "key"
    if (input.hasOwnProperty("key")) {
      obj = frontmatter[input.key];
      key = input.key;
    }
    else {
      obj = frontmatter;
    }
    if (input.hasOwnProperty("header")) {
      header = input.header;
    }
    else {
      // if key is not empty, capitalize the first letter
      if (key !== "") {
        key = key.charAt(0).toUpperCase() + key.slice(1);
      }
      header = `${key} Properties`;
    }
  }
  dv.header(2, header, { container: properties });
  listTree[rootKey] = dv.el("ul", "", { container: properties });
  yaml_object_to_list(obj, listTree, 0, "");
}

function yaml_object_to_list(obj, listTree, level, parent) {

  if (parent === "") {
    parent = rootKey;
  }

  const objkeys = Object.keys(obj);

  objkeys.forEach(okey => {
    if (obj[okey] instanceof Object) {
      if (obj[okey] instanceof Array) {
        const parentEl = listTree[parent];
        // check if the array contains an object 
        if (obj[okey].length > 0 && obj[okey].some((e) => e instanceof Object) ) {
          const listEl = dv.el("li", "", { container: parentEl });
          dv.el("div", okey, { container: listEl, cls: "property-object" });
          listTree[okey] = dv.el("ul", "", { container: parentEl });
          obj[okey].forEach(entry => {
            if (entry instanceof Object) {
              const listEl = dv.el("li", "", { container: parentEl });
              dv.el("div", okey, { container: listEl, cls: "property-object" });
              listTree[okey] = dv.el("ul", "", { container: parentEl })
              yaml_object_to_list(entry, listTree, level + 1, okey)
            }
            else {
              const parentEl = listTree[parent];
              dv.el("li", `${entry}`, { container: parentEl });
            }
          })
        }
        else {
          const data_type = "list"
          const listEl = dv.el("li", "", { container: parentEl });
          dv.el("div", okey, { container: listEl, cls: "property-key", attr: { "data-type": data_type } });
          obj[okey].forEach(element => {
            const data_type = get_data_type(okey, obj[okey]);
            dv.el("div", element, { container: listEl, cls: "property-array-value", attr: { "data-type": data_type } });
          });
        }     
        // console.log(JSON.stringify(obj[okey]))
      } else {
        const parentEl = listTree[parent];
        const listEl = dv.el("li", "", { container: parentEl });
        dv.el("div", okey, { container: listEl, cls: "property-object" });
        listTree[okey] = dv.el("ul", "", { container: parentEl });
        yaml_object_to_list(obj[okey], listTree, level + 1, okey)
      }
    } else {
      // determine data type of obj[okey]
      const data_type = get_data_type(okey, obj[okey]);
      const parentEl = listTree[parent];
      const listEl = dv.el("li", "", { container: parentEl });
      dv.el("div", okey, { container: listEl, cls: "property-key", attr: { "data-type": data_type } });
      dv.el("div", obj[okey], { container: listEl, cls: "property-value", attr: { "data-type": data_type } });
    }
  });
}

function get_data_type(key, value) {
  let data_type = "string";
  if (typeof value === "number") {
    data_type = "number";
  }
  else if (typeof value === "boolean") {
    data_type = "boolean";
  }
  else if (typeof value === "object") {
    data_type = "object";
  }
  else {
    switch (key.toLowerCase()) {
      case "date":
        data_type = "date";
        break;
      case "time":
        data_type = "time";
        break;
      case "link":
        data_type = "link";
        break;
      default:
        data_type = "string";
    }
  }
  return data_type;
}
```


CSS

```css
/* ========================================================
 * PROPERTIES
 * ======================================================== */

.note-properties {
    margin-top: 1rem;
    margin-bottom: 1rem;
}

.note-properties ul {
    list-style-type: none;
    padding: 0;
}

.note-properties ul ul {
    padding-left: 22px;
}

.note-properties li {
    display: flex;
}

.note-properties h2 {
    margin-top: 0;
    margin-bottom: 1rem;
    font-size: 1.2rem;
    font-weight: var(--bold-weight);
    /* color: var(--text-muted); */
}

.property-object {
    font-size: 0.9rem;
    font-weight: var(--bold-weight);
    color: var(--text-muted);
    margin-bottom: 0.5rem;
}

div.property-key:before {
    content: "";
    display: block;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="%23797567" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-text"><path d="M17 6.1H3"></path><path d="M21 12.1H3"></path><path d="M15.1 18H3"></path></svg>') no-repeat;
    width: 18px;
    height: 18px;
    float: left;
    margin: 0 6px 0 0;
}

div.property-key[data-type="number"]:before {
    content: "";
    display: block;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="%23797567" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-binary"><rect x="14" y="14" width="4" height="6" rx="2"></rect><rect x="6" y="4" width="4" height="6" rx="2"></rect><path d="M6 20h4"></path><path d="M14 10h4"></path><path d="M6 14h2v6"></path><path d="M14 4h2v6"></path></svg>') no-repeat;
    width: 18px;
    height: 18px;
    float: left;
    margin: 0 6px 0 0;
}

div.property-key[data-type="date"]:before {
    content: "";
    display: block;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="%23797567" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-calendar"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>') no-repeat;
    width: 18px;
    height: 18px;
    float: left;
    margin: 0 6px 0 0;
}

div.property-key[data-type="time"]:before {
    content: "";
    display: block;
    background: url('data:image/svg+xml,<svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="%23797567" stroke-width="2"><circle cx="12" cy="12" r="11"/><line x1="12" y1="12" x2="12" y2="4"></line><line x1="12" y1="12" x2="18" y2="12"></line></svg>') no-repeat;
    width: 18px;
    height: 18px;
    float: left;
    margin: 0 6px 0 0;
}

div.property-key[data-type="link"]:before {
    content: "";
    display: block;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="%23797567" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-link"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>') no-repeat;
    width: 18px;
    height: 18px;
    float: left;
    margin: 0 6px 0 0;
}

div.property-key[data-type="list"]:before {
    content: "";
    display: block;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="%23797567" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-list"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>') no-repeat;
    width: 18px;
    height: 18px;
    float: left;
    margin: 0 6px 0 0;
}

.property-key {
    font-size: 0.9rem;
    /* font-weight: var(--bold-weight); */
    color: var(--text-muted);
    min-width: 200px;
}

div.property-key>span {
    padding-bottom: 3px;
}

.property-value {
    font-size: 0.9rem;
    color: var(--metadata-input-text-color);
}

.property-array-value {
    font-size: 0.9rem;
    color: var(--metadata-input-text-color);
    background-color: var(--background-secondary);
    padding: 0.1rem 0.6rem;
    margin-right: 0.1rem;
    border-radius: 15px;
}
```

