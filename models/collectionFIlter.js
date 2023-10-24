import queryString from "query-string";

export default class CollectionFilter {
  constructor(objects, params, model) {
    this.objects = objects; // tous les objets du fichier json
    this.params = params; // les params de la requete
    this.model = model;
    this.filteredList = [];
    this.possibilities = [
      "sort",
      "sort,desc",
      "desc",
      "limit",
      "offset",
      "field",
    ];
    this.funcs = [];
    this.copy = [];
    this.c = null;
  }

  enleverSymbole(mot) {
    return mot.replace(/\*/g, "");
  }

  convertToNumber = (e) => (!isNaN(e) ? parseInt(e) : e);

  selon(flt) {
    let action;

    if (flt[0] === "*") action = "d";

    if (flt[flt.length - 1] === "*") {
      if (action === "d") return "*";

      action = "p";
    }
    return action;
  }

  trier(desc = false, k) {
    if (this.funcs[0].func === "sort" || this.funcs[0].func === "sort,desc") {
      this.filteredList = this.objects.filter((obj) => obj.hasOwnProperty(k));
    }

    this.filteredList.sort((a, b) => {
      const valA = a[k];
      const valB = b[k];

      if (typeof valA === "number" && typeof valB === "number") {
        return desc ? valB - valA : valA - valB;
      } else {
        const strA = valA.toString().toLowerCase();
        const strB = valB.toString().toLowerCase();
        if (strA < strB) {
          return desc ? 1 : -1;
        }
        if (strA > strB) {
          return desc ? -1 : 1;
        }
        return 0;
      }
    });
  }

  field(colonne) {
    for (const o of this.objects) {
      for (const k in o) {
        if (colonne === k) {
          if (!this.isInList(o[k], k)) {
            this.filteredList.push({ [k]: o[k] });
          }
        }
      }
    }
  }

  filtrer(flt, mot) {
    let selon = this.selon(flt);
    flt = this.enleverSymbole(flt);

    if (selon === "d" && mot.slice([mot.length - flt.length]) === flt) {
      return true;
    } else if (selon === "p" && mot.startsWith(flt)) {
      return true;
    } else if (selon === "*" && mot.includes(flt)) {
      return true;
    }
    return false;
  }

  get() {
    this.getFunctions();

    for (let obj of this.objects) {
      for (let k in obj) {
        this.isInFunctions(k, obj);
      }
    }

    return this.filteredList;
  }

  getFunctions() {
    for (let func in this.params) {
      if (this.possibilities.includes(func) || this.isInModel(func)) {
        this.funcs.push({ func: func, val: this.params[func] });
      }
    }
  }

  isInModel(key) {
    for (let i of this.model["fields"]) {
      if (i.name === key) return true;
    }
    return false;
  }

  hasFunc = (liste, name) => {
    if (liste.length > 0) {
      for (const f of liste) {
        if (f.func === name) {
          return true;
        }
      }
    }
    return false;
  };

  isInList = (val, k) => this.filteredList.some((o) => o[k] === val);

  paginate(limit, offset) {
    const tempList = this.objects.slice(offset, offset + limit);
    this.filteredList = [...tempList];
  }

  isInFunctions(k, obj) {
    let offset;
    let limit;
    for (const f of this.funcs) {
      if (!f.val) continue;

      if (this.params.Category) {
        this.c = this.params.Category;
      }

      if (f.func === "sort" && f.val === k) {
        this.trier(false, k);
      }

      if (f.func === "sort,desc" && f.val === k) {
        this.trier(true, k);
      }

      if (f.func === "field" && f.val === k) {
        this.field(k);
      }

      if (f.func === k && Array.isArray(f.val)) {
        for (const v of f.val) {
          if (v === obj[k]) {
            if (this.c && obj.Category === this.c) {
              if (!this.isInFilteredList(obj)) {
                this.filteredList.push(obj);
              }
            }
          }
        }
      }

      if (f.val.includes("*") && f.func === k) {
        if (this.filtrer(f.val, obj[k])) {
          this.categorieMentionned(obj);
        }
      }

      if (f.func === k && f.val === obj[k]) {
        if (!this.isInFilteredList(obj)) {
          this.categorieMentionned(obj);
        }
      }

      if (f.func === "Id" && f.val == obj[k]) {
        this.filteredList.push(obj);
      }

      if(this.params.limit && this.params.offset) {
         this.paginate(parseInt(this.params.limit),parseInt(this.params.offset));
      }
    }
  }
  getIndexOfFunc = (funcName, list) => {
    if (list.length > 1) {
      for (let i = 0; i < list.length; ++i) {
        if (list[i].func === funcName) return i;
      }
    }

    return false;
  };

  categorieMentionned(obj) {
    if (this.c && obj.Category === this.c) {
      this.filteredList.push(obj);
    } else if (this.c === null) {
      this.filteredList.push(obj);
    }
  }

  paginate(limit, offset) {
    const start = offset;
    const end = offset + limit;
    this.filteredList = this.objects.slice(start, end);
     
  }
  isInFilteredList(obj) {
    return this.filteredList.some((item) => item.Id === obj.Id);
  }
}
 
