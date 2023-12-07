/* global on, setAttrs, getAttrs, getSectionIDs, getTranslationByKey,
  getTranslationLanguage, generateRowID, removeRepeatingRow */

(function () {
  "use strict";
  /* FUNCTIONS */
  function dataSetup() {
    Object.keys(crewData).forEach(crew => {
      const base = crewData[crew].base,
        translatedBaseAttributes = [
          ...[...Array(16).keys()].slice(1).map(i => `claim_${i}_name`),
          ...[...Array(16).keys()].slice(1).map(i => `claim_${i}_desc`),
          "cohort1_description",
          "cohort1_name",
          "cohort1_subtype",
          "crew_description",
          "crew_xp_condition",
          "hunting_grounds_type",
          "hunting_grounds_description",
          "upgrade_carriage_name",
          "upgrade_boat_name"
        ];
      Object.keys(base).forEach(attr => {
        if (translatedBaseAttributes.includes(attr)) {
          base[attr] = getTranslationByKey(base[attr]);
        }
      });
      crewData[crew].contact = [...Array(6).keys()].map(i => ({
        name: getTranslationByKey(`crew_${crew}_contact_${i}`)
      }));
      crewData[crew].crewability = crewData[crew].crewability.map(name => ({
        name: getTranslationByKey(`crew_ability_${name}`),
        description: getTranslationByKey(`crew_ability_${name}_description`)
      }));
      crewData[crew].upgrade.forEach(upgrade => {
        upgrade.name = getTranslationByKey(upgrade.name);
        upgrade.boxes_chosen = "1";
      });
    });
    itemData.forEach(item => {
      item.boxes_chosen = "1";
      item.name = getTranslationByKey(item.name);
      item.description = getTranslationByKey(item.description);
    });
    Object.keys(translatedDefaults).forEach(k => {
      translatedDefaults[k] = getTranslationByKey(translatedDefaults[k]);
    });
    Object.assign(defaultValues, translatedDefaults);
    Object.keys(factionsData).forEach(x => {
      factionsData[x].forEach(faction => {
        faction.name = getTranslationByKey(faction.name);
      });
    });
    alchemicalData.forEach((v, k) => {
      alchemicalData[k] = {
        name: getTranslationByKey(v)
      };
    });
    Object.keys(playbookData).forEach(playbook => {
      const base = playbookData[playbook].base,
        translatedBaseAttributes = [
          "char_cohort_name",
          "char_cohort_subtype",
          "friends_title",
          "gatherinfo1",
          "gatherinfo2",
          "gatherinfo3",
          "gatherinfo4",
          "gatherinfo5",
          "gatherinfo6",
          "playbook_description",
          "setting_stress_label",
          "setting_trauma_label",
          "special_abilities_title",
          "xp_condition",
          "xp_condition2",
          "xp_condition3"
        ];
      Object.keys(base).forEach(attr => {
        if (translatedBaseAttributes.includes(attr)) {
          base[attr] = getTranslationByKey(base[attr]);
        }
      });
      // TODO DROP THE IF STATEMENT HERE
      if (!["ghost", "hull"].includes(playbook)) {
        playbookData[playbook].friend = [...Array(5).keys()]
          .map(i => ({
            name: getTranslationByKey(`playbook_${playbook}_friend_${i}`)
          }))
          .filter(o => o.name);
      } else playbookData[playbook].friend = [];
      playbookData[playbook].ability = playbookData[playbook].ability
        .map(name => ({
          name: getTranslationByKey(`playbook_ability_${name}`),
          description:
            getTranslationByKey(`playbook_ability_${name}_description`)
        }));
      // TODO REMOVE SPIRIT PLAYBOOKS
      if (spiritPlaybooks.includes(playbook)) {
        playbookData[playbook].ability[0].check = "1";
      }
      playbookData[playbook].playbookitem.forEach(item => {
        item.name = getTranslationByKey(item.name);
        item.boxes_chosen = "1";
      });
    });
    const playbookAbilityMap = new Map([
      ...Object.values(playbookData).map(x => x.ability).reduce((m, v) => {
        v.forEach(a => m.add(a));
        return m;
      }, new Set())].map(x => {
      return [x.name.toLowerCase(), x.description];
    }));
    const crewAbilityMap = new Map([
      ...Object.values(crewData).map(x => x.crewability).reduce((m, v) => {
        v.forEach(a => m.add(a));
        return m;
      }, new Set())].map(x => {
      return [x.name.toLowerCase(), x.description];
    }));
    [
      crewData, playbookData, factionsData, actionData, traumaData, itemData,
      translatedDefaults, defaultValues, spiritPlaybooks, alchemicalData,
    ].forEach(x => Object.freeze(x));
    return [playbookAbilityMap, crewAbilityMap];
  }

  function mySetAttrs(attrs, options, callback) {
    const finalAttrs = Object.keys(attrs).reduce((m, k) => {
      m[k] = `${attrs[k]}`;
      return m;
    }, {});
    if (options && !("silent" in options)) {
      options.silent = true;
    }
    setAttrs(finalAttrs, options, callback);
  }

  function setAttr(name, value) {
    getAttrs([name], v => {
      const setting = {};
      if (v[name] !== `${value}`) setting[name] = `${value}`;
      setAttrs(setting);
    });
  }

  function fillRepeatingSectionFromData(
    sectionName, dataList, autogen, callback) {
    callback = callback || (() => {});
    getSectionIDs(`repeating_${sectionName}`, idList => {
      const existingRowAttributes = [
        ...idList.map(id => `repeating_${sectionName}_${id}_name`),
        ...idList.map(id => `repeating_${sectionName}_${id}_autogen`)
      ];
      getAttrs(existingRowAttributes, v => {
        /* Delete auto-generated rows */
        if (autogen) {
          idList = idList.filter(id => {
            if (v[`repeating_${sectionName}_${id}_autogen`]) {
              removeRepeatingRow(`repeating_${sectionName}_${id}`);
              return false;
            } else return true;
          });
        }
        const existingRowNames = idList
          .map(id => v[`repeating_${sectionName}_${id}_name`]);
        const createdIDs = [];
        const setting = dataList.filter(o => !existingRowNames.includes(o.name))
          .map(o => {
            let rowID;
            while (!rowID) {
              let newID = generateRowID();
              if (!createdIDs.includes(newID)) {
                rowID = newID;
                createdIDs.push(rowID);
              }
            }
            const newAttrs = {};
            if (autogen) {
              newAttrs[`repeating_${sectionName}_${rowID}_autogen`] = "1";
            }
            return Object.keys(o).reduce((m, key) => {
              m[`repeating_${sectionName}_${rowID}_${key}`] = o[key];
              return m;
            }, newAttrs);
          })
          .reduce((m, o) => Object.assign(m, o), {});
        mySetAttrs(setting, {}, callback);
      });
    });
  }

  function diceMagic(num) {
    if (num > 0) {
      return `dice=${
        [...Array(num).keys()].map(() => "[[d6]]").join("&" + "#44" + "; ")
      }`;
    } else {
      return "zerodice=[[d6]]&" + "#44" + "; [[d6]]";
    }
  }

  function buildRollFormula(base) {
    return ` {{?{@{bonusdice}|${
      [0, 1, 2, 3, 4, 5, 6, -1, -2, -3]
        .map(n => `${n},${diceMagic(n + (parseInt(base) || 0))}`).join("|")
    }}}}`;
  }

  function buildNumdiceFormula() {
    return ` {{?{${getTranslationByKey("numberofdice")}|${
      [0, 1, 2, 3, 4, 5, 6].map(n => `${n},${diceMagic(n)}`).join("|")
    }}}}`;
  }

  function emptyFirstRowIfUnnamed(sectionName) {
    getSectionIDs(`repeating_${sectionName}`, idList => {
      const id = idList[0];
      getAttrs([`repeating_${sectionName}_${id}_name`], v => {
        if (!v[`repeating_${sectionName}_${id}_name`]) {
          removeRepeatingRow(`repeating_${sectionName}_${id}`);
        }
      });
    });
  }

  function handleBoxesFill(name, upToFour) {
    on(`change:${name}1 change:${name}2 change:${name}3 change:${name}4`,
      event => {
        if (event.sourceType !== "player") return;
        getAttrs([event.sourceAttribute], v => {
          const rName = event.sourceAttribute.slice(0, -1),
            setting = {};
          if (`${v[event.sourceAttribute]}` === "1") {
            switch (event.sourceAttribute.slice(-1)) {
            case "4":
              setting[`${rName}3`] = 1;
              /* falls through */
            case "3":
              setting[`${rName}2`] = 1;
              /* falls through */
            case "2":
              setting[`${rName}1`] = 1;
            }
          }
          if (`${v[event.sourceAttribute]}` === "0") {
            switch (event.sourceAttribute.slice(-1)) {
            case "1":
              setting[`${rName}2`] = 0;
              /* falls through */
            case "2":
              setting[`${rName}3`] = 0;
              /* falls through */
            case "3":
              if (upToFour) setting[`${rName}4`] = 0;
            }
          }
          mySetAttrs(setting);
        });
      });
  }

  function calculateResistance(attrName) {
    getAttrs([...actionData[attrName], `setting_resbonus_${attrName}`], v => {
      const total = actionData[attrName].map(x => v[x])
        .reduce((s, c) => s + (`${c}` === "0" ? 0 : 1), 0);
      mySetAttrs({
        [attrName]:
          total,
        [`${attrName}_formula`]:
          buildRollFormula(total + parseInt(v[`setting_resbonus_${attrName}`])),
      });
    });
  }

  function calculateVice () {
    getAttrs(Object.keys(actionData), v => {
      const total = Math.min(...Object.keys(v).map(x => parseInt(v[x]) || 0));
      setAttr("vice_formula", buildRollFormula(total));
    });
  }

  function calculateTrauma(event) {
    getAttrs([
      "setting_traumata_set",
      ...traumaDataFlat.map(x => `trauma_${x}`)
    ], v => {
      const traumaType = v.setting_traumata_set === "0" ? "normal"
        : v.setting_traumata_set;
      if (traumaData[traumaType] && event.sourceType === "player") {
        const newTrauma = traumaData[traumaType]
          .reduce((m, name) => m + (parseInt(v[`trauma_${name}`]) || 0), 0);
        setAttr("trauma", newTrauma);
      }
    });
  }

  function calculateStashFormula() {
    getAttrs(["stash"], v => {
      setAttr("stash_formula", buildRollFormula(
        Math.floor(parseInt(v.stash) / 10)));
    });
  }

  function calculateWantedFormula() {
    getAttrs(["wanted"], v => {
      setAttr("wanted_formula", buildRollFormula(v.wanted));
    });
  }

  function calculateCohortDice(prefixes) {
    const sourceAttrs = [
      "crew_tier",
      ...prefixes.map(p => `${p}_impaired`),
      ...prefixes.map(p => `${p}_type`),
      ...prefixes.map(p => `${p}_roll_formula`),
    ];
    getAttrs(sourceAttrs, v => {
      const setting = {};
      prefixes.forEach(prefix => {
        const formula = buildRollFormula(
          (parseInt(v.crew_tier) || 0) -
          (parseInt(v[`${prefix}_impaired`]) || 0) +
          (["elite", "expert"].includes(v[`${prefix}_type`]) ? 1 : 0));
        if (formula !== v[`${prefix}_roll_formula`]) {
          setting[`${prefix}_roll_formula`] = formula;
        }
      });
      setAttrs(setting);
    });
  }

  function calculateCharCohortDice() {
    getAttrs(["char_cohort_quality", "char_cohort_impaired"], v => {
      const dice = (parseInt(v.char_cohort_quality) || 0) -
        (parseInt(v.char_cohort_impaired) || 0);
      setAttr("char_cohort_roll_formula", buildRollFormula(dice));
    });
  }

  function cleanChatImage(event) {
    const RE = /^(https:\/\/s3\.amazonaws\.com\/files\.d20\.io\/images\/.*)\/(?:med|max|original|thumb)\.(jpg|png)\?\d+$/;
    const match = (event.newValue || "").match(RE);
    if (match) setAttr("chat_image", `${match[1]}/thumb.${match[2]}`);
  }

  function handlePlaybookFill(event) {
    getAttrs([
      "playbook",
      "crew_type",
      "changed_attributes",
      "setting_autofill",
      ...watchedAttributes
    ], v => {
      const changedAttributes = (v.changed_attributes || "").split(",");
      const sourceName = translatedNames[
        (event.sourceAttribute === "crew_type" ? v.crew_type : v.playbook)
          .toLowerCase()];
      const fillBaseData = (data, defaultAttrNames) => {
        if (data) {
          const finalSettings = defaultAttrNames
            .filter(name => !changedAttributes.includes(name))
            // do not reset attributes which have been changed by the user
            .filter(name => !spiritPlaybooks.includes(sourceName) ||
              !actionsFlat.includes(name))
            // do not reset action dots if changing to a spirit playbook - TODO DELETE THIS
            .filter(name => v[name] !== (defaultValues[name] || ""))
            // do not set attributes if current value is equal to sheet defaults
            .reduce((m, name) => {
              m[name] = defaultValues[name] || "";
              return m;
            }, {});
          Object.keys(data).filter(name => !changedAttributes.includes(name))
            .forEach(name => (finalSettings[name] = data[name]));
          mySetAttrs(finalSettings);
        }
      };
      if (event.sourceAttribute === "crew_type" ? v.crew_type : v.playbook) {
        setAttr("show_playbook_reminder", "0");
      }
      if (v.setting_autofill !== "1") return;
      if (event.sourceAttribute === "crew_type" && sourceName in crewData) {
        fillRepeatingSectionFromData("contact",
          crewData[sourceName].contact, true);
        fillRepeatingSectionFromData("crewability",
          crewData[sourceName].crewability, true);
        fillRepeatingSectionFromData("upgrade",
          crewData[sourceName].upgrade, true);
        fillBaseData(crewData[sourceName].base, crewAttributes);
      }
      if (event.sourceAttribute === "playbook" && sourceName in playbookData) {
        fillRepeatingSectionFromData("friend",
          playbookData[sourceName].friend, true);
        fillRepeatingSectionFromData("ability",
          playbookData[sourceName].ability, true);
        fillRepeatingSectionFromData("playbookitem",
          playbookData[sourceName].playbookitem, true);
        fillBaseData(playbookData[sourceName].base, playbookAttributes);
        if (sourceName === "leech" || sourceName === "zindiq") {
          fillRepeatingSectionFromData("alchemical", alchemicalData);
        }
      }
    });
  }

  function fillAbility(prefix, abilityMap) {
    getAttrs([`${prefix}_name`, `${prefix}_description`], v => {
      if (!v[`${prefix}_description`]) {
        const description = abilityMap.get((v[`${prefix}_name`] || "")
          .toLowerCase());
        if (description) setAttr(`${prefix}_description`, description);
      }
    });
  }

  function handleAutoExpandWhitespace(name) {
    on(`change:${name}`, event => {
      const attrName = name.replace(":", "_");
      getAttrs([attrName], v => {
        if (v[attrName].trim() !== v[attrName] &&
          event.sourceType === "player") {
          setAttr(attrName, v[attrName].trim());
        }
      });
    });
  }

  function handleCohortVerb(prefix) {
    const eventString = `change:${prefix}${
      (prefix === "repeating_cohort") ? ":" : "_"}type`;
    on(eventString, event => {
      const verb = (event.newValue === "expert") ?
        "^{rolls_their}" : "^{roll_their}";
      setAttr(`${prefix}_verb`, verb);
    });
  }

  function handleConsequenceQuery() {
    getAttrs(["setting_consequence_query"], v => {
      const consequenceQuery = (`${v.setting_consequence_query}` === "1") ?
        `?{${getTranslationByKey("consequence")}|${
          getTranslationByKey("a_consequence")}}` : "^{a_consequence}";
      setAttr("consequence_query", consequenceQuery);
    });
  }

  function handlePseudoRadio(name) {
    on(`change:${name}`, event => {
      if (`${event.newValue}` === "0" && event.sourceType === "player") {
        setAttr(name, (parseInt(event.previousValue) || 1) - 1);
      }
      setAttr(`${name}_formula`, buildRollFormula(event.newValue || "0"));
    });
  }

  function handleRepeatingGenerateButton(sectionName) {
    on(`change:generate_${sectionName}`, () => {
      getAttrs([
        "generate_source_character",
        "generate_source_crew",
        "sheet_type"
      ], v => {
        const data = (v.sheet_type === "character") ? playbookData : crewData,
          genSource = v[`generate_source_${v.sheet_type}`];
        if (genSource in data) {
          emptyFirstRowIfUnnamed(sectionName);
          fillRepeatingSectionFromData(sectionName,
            data[genSource][sectionName]);
        }
      });
    });
  }

  function handleSheetInit() {
    getAttrs(["sheet_type", "crew_type", "playbook"], v => {
      /* Make sure sheet_type is never 0 */
      if (!["crew", "faction"].includes(v.sheet_type)) {
        setAttr("sheet_type", "character");
      }
      /* Remove reminder box if we have playbook or crew name */
      if (v.playbook || v.crew_type) setAttr("show_playbook_reminder", "0");
    });
    /* Setup and upgrades */
    getAttrs(["version"], v => {
      const addVersion = (object, version) => {
        object.version = version;
        object.character_sheet = `Sea of Dead Men v${version}`;
      };
      const upgradeSheet = version => {
        const versionMajor = version && parseInt(version.split(".")[0]),
          versionMinor = version && parseInt(version.split(".")[1]);
        console.log(`Found version ${version}.`);
        if (version !== sheetVersion) console.log("Performing sheet upgrade.");
        // Upgrade to 3.6: recalculate all formulas
        if (versionMajor === 3 && versionMinor < 6) {
          const setting = {};
          addVersion(setting, "3.6");
          recalculateDiceFormulas();
          mySetAttrs(setting, {}, () => upgradeSheet("3.6"));
        }
        // Fall back to upgrading to the newest version.
        else {
          const setting = {};
          addVersion(setting, sheetVersion);
          mySetAttrs(setting);
        }
      };
      const initialiseSheet = () => {
        const setting = [
          "ability",
          "friend",
          "crewability",
          "contact",
          "playbookitem",
          "upgrade",
          "framefeature"
        ].reduce((memo, sectionName) => {
          memo[`repeating_${sectionName}_${generateRowID()}_autogen`] = 1;
          return memo;
        }, {});
        addVersion(setting, sheetVersion);
        /* Set translated default values */
        getAttrs(Object.keys(translatedDefaults), v => {
          Object.keys(translatedDefaults).forEach(k => {
            if (v[k] !== translatedDefaults[k]) {
              setting[k] = translatedDefaults[k];
            }
          });
          mySetAttrs(setting);
          console.log("Initialising new sheet.");
        });
        fillRepeatingSectionFromData("item", itemData);
      };
      if (v.version) upgradeSheet(v.version);
      else initialiseSheet();
    });
  }

  function recalculateDiceFormulas() {
    getSectionIDs("repeating_cohort", idArray => {
      calculateCohortDice(
        [...idArray.map(id => `repeating_cohort_${id}`), "cohort1"]);
    });
    getAttrs([
      ...actionsFlat,
      "crew_tier",
      "char_cohort_quality",
      "char_cohort_impaired",
      "setting_show_cohort"
    ], v => {
      [...actionsFlat, "crew_tier"]
        .forEach(name => setAttr(`${name}_formula`,
          buildRollFormula(v[name])));
      if (v.setting_show_cohort === "1") {
        const dice = (parseInt(v.char_cohort_quality) || 0) -
          (parseInt(v.char_cohort_impaired) || 0);
        setAttr("char_cohort_roll_formula", buildRollFormula(dice));
      }
    });
    Object.keys(actionData).forEach(calculateResistance);
    calculateVice();
    calculateStashFormula();
    calculateWantedFormula();
  }

  function resetItems() {
    const clearChecks = sectionName => {
      getSectionIDs(`repeating_${sectionName}`, idArray => {
        const setting = [
          ...idArray.map(id => `repeating_${sectionName}_${id}_check_1`),
          ...idArray.map(id => `repeating_${sectionName}_${id}_check_2`),
          ...idArray.map(id => `repeating_${sectionName}_${id}_check_3`)
        ].reduce((m, name) => {
          m[name] = 0;
          return m;
        }, {});
        mySetAttrs(setting);
      });
    };
    setAttr("load", 0);
    ["item", "playbookitem"].forEach(clearChecks);
  }

  function setupTranslatedAttrs() {
    /* Set up translated attributes */
    const translatedAttrs = {
      bonusdice: getTranslationByKey("bonusdice"),
      effect_query: getTranslationByKey("effect_query"),
      notes_query: `?{${getTranslationByKey("notes")}}`,
      numberofdice: buildNumdiceFormula(),
      position_query: `?{${getTranslationByKey("position")}|${
        getTranslationByKey("risky")},position=${
        getTranslationByKey("risky")}|${
        getTranslationByKey("controlled")},position=${
        getTranslationByKey("controlled")}|${
        getTranslationByKey("desperate")},position=${
        getTranslationByKey("desperate")}|${
        getTranslationByKey("fortune_roll")},short=short}`,
      title_text: "",
    };
    getAttrs([
      ...Object.keys(translatedAttrs),
      "setting_usekirsty",
      "setting_custom_actions",
    ], v => {
      const lang = getTranslationLanguage();
      const kirsty = v.setting_usekirsty === "1" ? " {{kirsty=1}}" : "";
      let hasTitleText = v.setting_custom_actions === "1";
      let languageSuffix = "";

      if (["fr", "es", "ko", "pt"].includes(lang)) {
        hasTitleText = true;
        languageSuffix = `{{language=i18n-${lang}}} `;
      }
      translatedAttrs.title_text =
        `${hasTitleText ? "{{title-text=1}} " : ""}${languageSuffix}${kirsty}`;
      const setting = {};
      Object.keys(translatedAttrs).forEach(name => {
        if (v[name] !== translatedAttrs[name]) {
          setting[name] = translatedAttrs[name];
        }
      });
      mySetAttrs(setting);
    });
  }

  function updateChangedAttrs(event) {
    if (event.sourceType === "player") {
      getAttrs(["changed_attributes"], v => {
        const changedAttributes = [
          ...new Set(v.changed_attributes.split(","))
            .add(event.sourceAttribute)
        ].filter(x => !!x).join(",");
        setAttr("changed_attributes", changedAttributes);
      });
    }
  }

  function watchAutogen(sectionName) {
    on(`change:repeating_${sectionName}`, event => {
      getAttrs([`repeating_${sectionName}_autogen`], v => {
        if (v[`repeating_${sectionName}_autogen`] &&
          event.sourceType === "player") {
          setAttr(`repeating_${sectionName}_autogen`, "");
        }
      });
    });
  }

  // TODO DELETE
  // function handleDarkTalentChange(attribute) {
  //   getAttrs([
  //     `setting_dark_talent_${attribute}`,
  //     `setting_resbonus_${attribute}`
  //   ], v => {
  //     const resistanceBonus =
  //       (parseInt(v[`setting_resbonus_${attribute}`]) || 0) +
  //       ((`${v[`setting_dark_talent_${attribute}`]}` === "1") ? 1 : -1);
  //     setAttr(`setting_resbonus_${attribute}`, resistanceBonus);
  //   });
  // }

  function generateFactions() {
    setAttr("show_faction_generatebutton", "0");
    Object.keys(factionsData).forEach(sectionName => {
      fillRepeatingSectionFromData(sectionName, factionsData[sectionName]);
    });
  }

  function setRollMods() {
    getAttrs(["setting_custom_actions"], v => {
      function getRollMods(prefix) {
        if (v.setting_custom_actions == "0") {
          return "";
        } else {
          return `{{title=@{${prefix}_label}}}`;
        }
      }

      const setting = {};
      Object.keys(actionData).forEach(attribute => {
        setting[`${attribute}_roll_mods`] = getRollMods(attribute);
        actionData[attribute].forEach(action => {
          setting[`${action}_roll_mods`] = getRollMods(action);
        });
      });
      mySetAttrs(setting);
    });
  }

  /* DATA */
  const sheetVersion = "3.9";
  const crewData = {
    assassins: {
      base: {
        claim_1_desc: "claim_training_rooms_description",
        claim_1_name: "claim_training_rooms",
        claim_2_desc: "claim_vice_den_description",
        claim_2_name: "claim_vice_den",
        claim_3_desc: "claim_fixer_description",
        claim_3_name: "claim_fixer",
        claim_4_desc: "claim_informants_description",
        claim_4_name: "claim_informants",
        claim_5_desc: "claim_hagfish_farm_description",
        claim_5_name: "claim_hagfish_farm",
        claim_6_desc: "claim_victim_trophies_description",
        claim_6_name: "claim_victim_trophies",
        claim_7_name: "claim_turf",
        claim_9_name: "claim_turf",
        claim_10_desc: "claim_cover_operation_description",
        claim_10_name: "claim_cover_operation",
        claim_11_desc: "claim_protection_racket_description",
        claim_11_name: "claim_protection_racket",
        claim_12_desc: "claim_infirmary_description",
        claim_12_name: "claim_infirmary",
        claim_13_desc: "claim_envoy_description",
        claim_13_name: "claim_envoy",
        claim_14_desc: "claim_cover_identities_description",
        claim_14_name: "claim_cover_identities",
        claim_15_desc: "claim_city_records_description",
        claim_15_name: "claim_city_records",
        claim_bridge_2_3: 0,
        claim_bridge_3_4: 0,
        claim_bridge_6_7: 0,
        claim_bridge_9_14: 0,
        claim_bridge_12_13: 0,
        claim_bridge_13_14: 0,
        crew_description: "crew_assassins_description",
        crew_xp_condition: "crew_assassins_xp_condition",
        hunting_grounds_type: "crew_assassins_hunting_grounds_type",
        hunting_grounds_description: "crew_assassins_hunting_grounds_description",
        upgrade_insight_check_1: "1",
        upgrade_prowess_check_1: "1"
      },
      crewability: ["deadly", "crow's_veil", "emberdeath", "no_traces", "patron", "predators", "vipers", "veteran"],
      upgrade: [{
        name: "crew_upgrade_hardened",
        numboxes: "3"
      }, {
        name: "crew_upgrade_assassin_rigging",
        numboxes: "1"
      }, {
        name: "crew_upgrade_ironhook_contacts",
        numboxes: "1"
      }, {
        name: "crew_upgrade_elite_skulks",
        numboxes: "1"
      }, {
        name: "crew_upgrade_elite_thugs",
        numboxes: "1",
      }]
    },
    bravos: {
      base: {
        claim_1_desc: "claim_barracks_description",
        claim_1_name: "claim_barracks",
        claim_2_name: "claim_turf",
        claim_3_desc: "claim_terrorized_citizens_description",
        claim_3_name: "claim_terrorized_citizens",
        claim_4_desc: "claim_informants_description",
        claim_4_name: "claim_informants",
        claim_5_desc: "claim_protection_racket_description",
        claim_5_name: "claim_protection_racket",
        claim_6_desc: "claim_fighting_pits_description",
        claim_6_name: "claim_fighting_pits",
        claim_7_name: "claim_turf",
        claim_9_name: "claim_turf",
        claim_10_name: "claim_turf",
        claim_11_desc: "claim_infirmary_description",
        claim_11_name: "claim_infirmary",
        claim_12_desc: "claim_bluecoat_intimidation_description",
        claim_12_name: "claim_bluecoat_intimidation",
        claim_13_desc: "claim_street_fence_description",
        claim_13_name: "claim_street_fence",
        claim_14_desc: "claim_warehouses_description",
        claim_14_name: "claim_warehouses",
        claim_15_desc: "claim_bluecoat_confederates_description",
        claim_15_name: "claim_bluecoat_confederates",
        claim_bridge_3_4: 0,
        claim_bridge_2_7: 0,
        claim_bridge_12_13: 0,
        cohort1_subtype: "thugs",
        crew_description: "crew_bravos_description",
        crew_xp_condition: "crew_bravos_xp_condition",
        hunting_grounds_type: "crew_bravos_hunting_grounds_type",
        hunting_grounds_description: "crew_bravos_hunting_grounds_description",
        upgrade_prowess_check_1: "1"
      },
      crewability: ["dangerous", "blood_brothers", "door_kickers", "fiends", "forged_in_the_fire", "patron", "war_dogs", "veteran"],
      upgrade: [{
        name: "crew_upgrade_hardened",
        numboxes: "3"
      }, {
        name: "crew_upgrade_bravos_rigging",
        numboxes: "1"
      }, {
        name: "crew_upgrade_ironhook_contacts",
        numboxes: "1"
      }, {
        name: "crew_upgrade_elite_rovers",
        numboxes: "1"
      }, {
        name: "crew_upgrade_elite_thugs",
        numboxes: "1",
      }]
    },
    cult: {
      base: {
        claim_1_desc: "claim_cloister_description",
        claim_1_name: "claim_cloister",
        claim_2_desc: "claim_vice_den_description",
        claim_2_name: "claim_vice_den",
        claim_3_desc: "claim_offertory_description",
        claim_3_name: "claim_offertory",
        claim_4_desc: "claim_ancient_obelisk_description",
        claim_4_name: "claim_ancient_obelisk",
        claim_5_desc: "claim_ancient_tower_description",
        claim_5_name: "claim_ancient_tower",
        claim_6_name: "claim_turf",
        claim_7_name: "claim_turf",
        claim_9_name: "claim_turf",
        claim_10_name: "claim_turf",
        claim_11_desc: "claim_spirit_well_description",
        claim_11_name: "claim_spirit_well",
        claim_12_desc: "claim_ancient_gate_description",
        claim_12_name: "claim_ancient_gate",
        claim_13_desc: "claim_sanctuary_description",
        claim_13_name: "claim_sanctuary",
        claim_14_desc: "claim_sacred_nexus_description",
        claim_14_name: "claim_sacred_nexus",
        claim_15_desc: "claim_ancient_altar_description",
        claim_15_name: "claim_ancient_altar",
        claim_bridge_3_4: 0,
        claim_bridge_4_9: 0,
        claim_bridge_6_11: 0,
        claim_bridge_12_13: 0,
        claim_bridge_13_14: 0,
        cohort1_subtype: "adepts",
        crew_description: "crew_cult_description",
        crew_xp_condition: "crew_cult_xp_condition",
        hunting_grounds_type: "crew_cult_hunting_grounds_type",
        hunting_grounds_description: "crew_cult_hunting_grounds_description",
        setting_show_deity: "1",
        upgrade_resolve_check_1: "1"
      },
      crewability: ["chosen", "anointed", "bound_in_darkness", "conviction", "glory_incarnate", "sealed_in_blood", "zealotry", "veteran"],
      upgrade: [{
        name: "crew_upgrade_ordained",
        numboxes: "3"
      }, {
        name: "crew_upgrade_cult_rigging",
        numboxes: "1"
      }, {
        name: "crew_upgrade_ritual_sanctum_in_lair",
        numboxes: "1"
      }, {
        name: "crew_upgrade_elite_adepts",
        numboxes: "1"
      }, {
        name: "crew_upgrade_elite_thugs",
        numboxes: "1",
      }]
    },
    hawkers: {
      base: {
        claim_1_name: "claim_turf",
        claim_2_desc: "claim_personal_clothier_description",
        claim_2_name: "claim_personal_clothier",
        claim_3_desc: "claim_local_graft_description",
        claim_3_name: "claim_local_graft",
        claim_4_desc: "claim_lookouts_description",
        claim_4_name: "claim_lookouts",
        claim_5_desc: "claim_informants_description",
        claim_5_name: "claim_informants",
        claim_6_name: "claim_turf",
        claim_7_name: "claim_turf",
        claim_9_name: "claim_turf",
        claim_10_desc: "claim_luxury_venue_description",
        claim_10_name: "claim_luxury_venue",
        claim_11_desc: "claim_foreign_market_description",
        claim_11_name: "claim_foreign_market",
        claim_12_desc: "claim_vice_den_description",
        claim_12_name: "claim_vice_den",
        claim_13_desc: "claim_surplus_caches_description",
        claim_13_name: "claim_surplus_caches",
        claim_14_desc: "claim_cover_operation_description",
        claim_14_name: "claim_cover_operation",
        claim_15_desc: "claim_cover_identities_description",
        claim_15_name: "claim_cover_identities",
        claim_bridge_2_3: 0,
        claim_bridge_3_4: 0,
        claim_bridge_6_7: 0,
        claim_bridge_10_15: 0,
        claim_bridge_12_13: 0,
        claim_bridge_13_14: 0,
        crew_description: "crew_hawkers_description",
        crew_xp_condition: "crew_hawkers_xp_condition",
        hunting_grounds_type: "crew_hawkers_hunting_grounds_type",
        hunting_grounds_description: "crew_hawkers_hunting_grounds_description",
        upgrade_secure_check_1: "1",
        upgrade_resolve_check_1: "1"
      },
      crewability: ["silver_tongues", "accord", "the_good_stuff", "ghost_market", "high_society", "hooked", "patron", "veteran"],
      upgrade: [{
        name: "crew_upgrade_composed",
        numboxes: "3"
      }, {
        name: "crew_upgrade_hawker's_rigging",
        numboxes: "1"
      }, {
        name: "crew_upgrade_ironhook_contacts",
        numboxes: "1"
      }, {
        name: "crew_upgrade_elite_rooks",
        numboxes: "1"
      }, {
        name: "crew_upgrade_elite_thugs",
        numboxes: "1",
      }]
    },
    shadows: {
      base: {
        claim_1_desc: "claim_interrogation_chamber_description",
        claim_1_name: "claim_interrogation_chamber",
        claim_2_name: "claim_turf",
        claim_3_desc: "claim_loyal_fence_description",
        claim_3_name: "claim_loyal_fence",
        claim_4_desc: "claim_gambling_den_description",
        claim_4_name: "claim_gambling_den",
        claim_5_desc: "claim_tavern_description",
        claim_5_name: "claim_tavern",
        claim_6_desc: "claim_drug_den_description",
        claim_6_name: "claim_drug_den",
        claim_7_desc: "claim_informants_description",
        claim_7_name: "claim_informants",
        claim_9_name: "claim_turf",
        claim_10_desc: "claim_lookouts_description",
        claim_10_name: "claim_lookouts",
        claim_11_desc: "claim_hagfish_farm_description",
        claim_11_name: "claim_hagfish_farm",
        claim_12_desc: "claim_infirmary_description",
        claim_12_name: "claim_infirmary",
        claim_13_desc: "claim_covert_drops_description",
        claim_13_name: "claim_covert_drops",
        claim_14_name: "claim_turf",
        claim_15_desc: "claim_secret_pathways_description",
        claim_15_name: "claim_secret_pathways",
        claim_bridge_3_4: 0,
        claim_bridge_2_7: 0,
        claim_bridge_9_14: 0,
        claim_bridge_12_13: 0,
        crew_description: "crew_shadows_description",
        crew_xp_condition: "crew_shadows_xp_condition",
        hunting_grounds_type: "crew_shadows_hunting_grounds_type",
        hunting_grounds_description: "crew_shadows_hunting_grounds_description",
        upgrade_hidden_check_1: "1",
        upgrade_prowess_check_1: "1"
      },
      crewability: ["everyone_steals", "ghost_echoes", "pack_rats", "patron", "second_story", "slippery", "synchronized", "veteran"],
      upgrade: [{
        name: "crew_upgrade_steady",
        numboxes: "3"
      }, {
        name: "crew_upgrade_thief_rigging",
        numboxes: "1"
      }, {
        name: "crew_upgrade_underground_maps_&_passkeys",
        numboxes: "1"
      }, {
        name: "crew_upgrade_elite_rooks",
        numboxes: "1"
      }, {
        name: "crew_upgrade_elite_skulks",
        numboxes: "1",
      }]
    },
    smugglers: {
      base: {
        claim_1_name: "claim_turf",
        claim_2_desc: "claim_side_business_description",
        claim_2_name: "claim_side_business",
        claim_3_desc: "claim_luxury_fence_description",
        claim_3_name: "claim_luxury_fence",
        claim_4_desc: "claim_vice_den_description",
        claim_4_name: "claim_vice_den",
        claim_5_desc: "claim_tavern_description",
        claim_5_name: "claim_tavern",
        claim_6_desc: "claim_ancient_gate_description",
        claim_6_name: "claim_ancient_gate",
        claim_7_name: "claim_turf",
        claim_9_name: "claim_turf",
        claim_10_name: "claim_turf",
        claim_11_desc: "claim_secret_routes_description",
        claim_11_name: "claim_secret_routes",
        claim_12_desc: "claim_informants_description",
        claim_12_name: "claim_informants",
        claim_13_desc: "claim_fleet_description",
        claim_13_name: "claim_fleet",
        claim_14_desc: "claim_cover_operation_description",
        claim_14_name: "claim_cover_operation",
        claim_15_desc: "claim_warehouse_description",
        claim_15_name: "claim_warehouse",
        claim_bridge_2_3: 0,
        claim_bridge_3_4: 0,
        claim_bridge_6_7: 0,
        claim_bridge_12_13: 0,
        claim_bridge_13_14: 0,
        cohort1_description: "vehicle_edges_flaws",
        cohort1_name: "vehicle",
        cohort1_subtype: "boat_carriage_other",
        cohort1_type: "expert",
        crew_description: "crew_smugglers_description",
        crew_xp_condition: "crew_smugglers_xp_condition",
        hunting_grounds_type: "crew_smugglers_hunting_grounds_type",
        hunting_grounds_description: "crew_smugglers_hunting_grounds_description",
        upgrade_carriage_check_1: "1",
        upgrade_carriage_name: "vehicle",
        upgrade_boat_name: "vehicle",
        upgrade_prowess_check_1: "1"
      },
      crewability: ["like_part_of_the_family", "all_hands", "ghost_passage", "just_passing_through", "leverage", "reavers", "renegades", "veteran"],
      upgrade: [{
        name: "crew_upgrade_steady",
        numboxes: "3"
      }, {
        name: "crew_upgrade_smuggler's_rigging",
        numboxes: "1"
      }, {
        name: "crew_upgrade_camouflage",
        numboxes: "1"
      }, {
        name: "crew_upgrade_elite_rovers",
        numboxes: "1"
      }, {
        name: "crew_upgrade_barge",
        numboxes: "1",
      }]
    },
    vigilantes: {
      base: {
        claim_1_desc: "claim_fierce_allies_description",
        claim_1_name: "claim_fierce_allies",
        claim_2_desc: "claim_local_heroes_description",
        claim_2_name: "claim_local_heroes",
        claim_3_desc: "claim_publicity_description",
        claim_3_name: "claim_publicity",
        claim_4_desc: "claim_hidden_paths_description",
        claim_4_name: "claim_hidden_paths",
        claim_5_desc: "claim_catacombs_description",
        claim_5_name: "claim_catacombs",
        claim_6_desc: "claim_defiant_citizens_description",
        claim_6_name: "claim_defiant_citizens",
        claim_7_name: "claim_turf",
        claim_9_name: "claim_turf",
        claim_10_desc: "claim_infirmary_description",
        claim_10_name: "claim_infirmary",
        claim_11_desc: "claim_above_the_law_description",
        claim_11_name: "claim_above_the_law",
        claim_12_desc: "claim_bluecoat_confidants_description",
        claim_12_name: "claim_bluecoat_confidants",
        claim_13_desc: "claim_lookouts_description",
        claim_13_name: "claim_lookouts",
        claim_14_desc: "claim_the_hookup_description",
        claim_14_name: "claim_the_hookup",
        claim_15_desc: "claim_doskvol's_most_wanted_description",
        claim_15_name: "claim_doskvol's_most_wanted",
        claim_bridge_2_3: 0,
        claim_bridge_3_4: 0,
        claim_bridge_6_11: 0,
        claim_bridge_10_15: 0,
        claim_bridge_12_13: 0,
        claim_bridge_13_14: 0,
        cohort1_type: "expert",
        crew_description: "crew_vigilantes_description",
        crew_xp_condition: "crew_vigilantes_xp_condition",
        hunting_grounds_type: "crew_vigilantes_hunting_grounds_type",
        hunting_grounds_description: "crew_vigilantes_hunting_grounds_description",
        setting_show_purpose: "1",
        upgrade_resolve_check_1: "1"
      },
      crewability: ["as_good_as_your_word", "avengers", "thorn_in_your_side", "misdirection", "uncanny_preparation", "moral_compass", "favors", "roots", "veteran"],
      upgrade: [{
        name: "crew_upgrade_unbroken",
        numboxes: "3"
      }, {
        name: "crew_upgrade_vigilantes_attire",
        numboxes: "1"
      }, {
        name: "crew_upgrade_dedicated_crafters",
        numboxes: "1",
      }, {
        name: "crew_upgrade_irregulars",
        numboxes: "1"
      }, {
        name: "crew_upgrade_willing_to_fight",
        numboxes: "1"
      }]
    }
  };
  const playbookData = {
    commander: {
      ability: ["expertise", "master_and_commander", "nobodys_fool", "ready_for_anything", "relentless", "self_control", "sharpshooter", "focused", "veteran"],
      base: {
        command: "2",
        navigate: "1",
        friends_title: "playbook_commander_friends_title",
        gatherinfo1: "gatherinfo_how_can_I_hurt",
        gatherinfo2: "gatherinfo_whos_most_afraid",
        gatherinfo3: "gatherinfo_whos_most_dangerous",
        gatherinfo4: "gatherinfo_what_do_they_intend",
        gatherinfo5: "gatherinfo_how_can_I_get_them",
        gatherinfo6: "gatherinfo_are_they_telling",
        playbook_description: "playbook_commander_description",
        xp_condition: "playbook_commander_xp_condition"
      },
      playbookitem: [{
        bold: "1",
        name: "playbook_item_fine_rifle",
        numboxes: "2"
      }, {
        bold: "1",
        name: "playbook_item_fine_pair_of_pistols",
        numboxes: "1"
      }, {
        bold: "1",
        name: "playbook_item_fine_navigational_tools",
        numboxes: "1"
      }, {
        name: "playbook_item_documents",
        numboxes: "1"
      }, {
        name: "playbook_item_personal_memento",
        numboxes: "1"
      }]
    },
    mariner: {
      ability: ["in_fine_condition", "bombardier", "no_rest_for_the_weary", "saboteur", "sawbones", "shipshape", "to_the_brink", "sturdy", "veteran"],
      base: {
        navigate: "2",
        patch: "1",
        friends_title: "playbook_mariner_friends_title",
        gatherinfo1: "gatherinfo_how_can_I_hurt",
        gatherinfo2: "gatherinfo_whos_most_afraid",
        gatherinfo3: "gatherinfo_whos_most_dangerous",
        gatherinfo4: "gatherinfo_what_do_they_intend",
        gatherinfo5: "gatherinfo_how_can_I_get_them",
        gatherinfo6: "gatherinfo_are_they_telling",
        playbook_description: "playbook_mariner_description",
        xp_condition: "playbook_mariner_xp_condition"
      },
      playbookitem: [{
        bold: "1",
        name: "playbook_item_fine_bottle_of_rum",
        numboxes: "1"
      }, {
        bold: "1",
        name: "playbook_item_fine_carpenters_tools",
        numboxes: "1"
      }, {
        bold: "1",
        name: "playbook_item_fine_explosive",
        numboxes: "1"
      }, {
        name: "playbook_item_trained_pet",
        numboxes: "1"
      }, {
        name: "playbook_item_warding_talisman",
        numboxes: "0"
      }]
    },
    occultist: {
      ability: ["from_the_deep", "black_spot", "born_in_brine", "familiar", "iron_will", "ritual", "tempest", "warded", "veteran"],
      base: {
        attune: "2",
        scan: "1",
        friends_title: "playbook_occultist_friends_title",
        gatherinfo1: "gatherinfo_how_can_I_hurt",
        gatherinfo2: "gatherinfo_whos_most_afraid",
        gatherinfo3: "gatherinfo_whos_most_dangerous",
        gatherinfo4: "gatherinfo_what_do_they_intend",
        gatherinfo5: "gatherinfo_how_can_I_get_them",
        gatherinfo6: "gatherinfo_are_they_telling",
        playbook_description: "playbook_occultist_description",
        xp_condition: "playbook_occultist_xp_condition"
      },
      playbookitem: [{
        bold: "1",
        name: "playbook_item_fine_whalebone_knife",
        numboxes: "1"
      }, {
        bold: "1",
        name: "playbook_item_fine_warding_talisman",
        numboxes: "0"
      }, {
        name: "playbook_item_fanciful_map",
        numboxes: "1"
      }, {
        name: "playbook_item_occult_focus",
        numboxes: "0"
      }, {
        name: "playbook_item_trained_pet",
        numboxes: "1"
      }]
    },
    reaver: {
      ability: ["savage", "armed_to_the_teeth", "bodyguard", "fearsome_reputation", "not_without_a_fight", "resilient", "right_bastard", "battleborn", "veteran"],
      base: {
        brawl: "2",
        command: "1",
        friends_title: "playbook_reaver_friends_title",
        gatherinfo1: "gatherinfo_how_can_I_hurt",
        gatherinfo2: "gatherinfo_whos_most_afraid",
        gatherinfo3: "gatherinfo_whos_most_dangerous",
        gatherinfo4: "gatherinfo_what_do_they_intend",
        gatherinfo5: "gatherinfo_how_can_I_get_them",
        gatherinfo6: "gatherinfo_are_they_telling",
        playbook_description: "playbook_reaver_description",
        xp_condition: "playbook_reaver_xp_condition"
      },
      playbookitem: [{
        bold: "1",
        name: "playbook_item_fine_brace_of_pistols",
        numboxes: "2"
      }, {
        bold: "1",
        name: "playbook_item_fine_hand_weapon",
        numboxes: "1"
      }, {
        bold: "1",
        name: "playbook_item_fine_heavy_armor",
        numboxes: "1"
      }, {
        name: "playbook_item_scary_weapon_or_tool",
        numboxes: "1"
      }, {
        name: "playbook_item_manacles_and_chain",
        numboxes: "1"
      }]
    },
    scoundrel: {
      ability: ["jack_of_all_trades", "ambush", "honest_face", "i_know_a_guy", "lead_from_behind", "set_the_stage", "weaving_the_web", "weasel", "veteran"],
      base: {
        sway: "2",
        skulk: "1",
        friends_title: "playbook_scoundrel_friends_title",
        gatherinfo1: "gatherinfo_how_can_I_hurt",
        gatherinfo2: "gatherinfo_whos_most_afraid",
        gatherinfo3: "gatherinfo_whos_most_dangerous",
        gatherinfo4: "gatherinfo_what_do_they_intend",
        gatherinfo5: "gatherinfo_how_can_I_get_them",
        gatherinfo6: "gatherinfo_are_they_telling",
        playbook_description: "playbook_scoundrel_description",
        xp_condition: "playbook_scoundrel_xp_condition"
      },
      playbookitem: [{
        bold: "1",
        name: "playbook_item_fine_concealed_weapon",
        numboxes: "0"
      }, {
        name: "playbook_item_forgery_kit",
        numboxes: "1"
      }, {
        name: "playbook_item_loaded_dice",
        numboxes: "0"
      }, {
        name: "playbook_item_lockpicking_tools",
        numboxes: "0"
      }, {
        name: "playbook_item_sleeping_powder",
        numboxes: "0"
      }]
    },
    swashbuckler: {
      ability: ["daredevil", "against_the_odds", "cloak_and_dagger", "momentum", "nemesis", "one_of_us", "reflexes", "irrepressible", "veteran"],
      base: {
        vault: "2",
        consort: "1",
        friends_title: "playbook_swashbuckler_friends_title",
        gatherinfo1: "gatherinfo_how_can_I_hurt",
        gatherinfo2: "gatherinfo_whos_most_afraid",
        gatherinfo3: "gatherinfo_whos_most_dangerous",
        gatherinfo4: "gatherinfo_what_do_they_intend",
        gatherinfo5: "gatherinfo_how_can_I_get_them",
        gatherinfo6: "gatherinfo_are_they_telling",
        playbook_description: "playbook_swashbuckler_description",
        xp_condition: "playbook_swashbuckler_xp_condition"
      },
      playbookitem: [{
        bold: "1",
        name: "playbook_item_fine_blade",
        numboxes: "1"
      }, {
        bold: "1",
        name: "playbook_item_fine_set_of_clothes",
        numboxes: "1"
      }, {
        bold: "1",
        name: "playbook_item_fine_bottle_of_wine",
        numboxes: "1"
      }, {
        bold: "1",
        name: "playbook_item_fine_musical_instrument",
        numboxes: "1"
      }, {
        name: "playbook_item_improvised_weapons",
        numboxes: "0"
      }]
    }
  };
  const factionsData = {
    factions1: [
      {
        name: "faction_the_unseen",
        tier: "IV",
        hold: "S"
      },
      {
        name: "faction_the_hive",
        tier: "IV",
        hold: "S"
      },
      {
        name: "faction_the_circle_of_flame",
        tier: "III",
        hold: "S"
      },
      {
        name: "faction_the_silver_nails",
        tier: "III",
        hold: "S"
      },
      {
        name: "faction_lord_scurlock",
        tier: "III",
        hold: "S"
      },
      {
        name: "faction_the_crows",
        tier: "II",
        hold: "W"
      },
      {
        name: "faction_the_lampblacks",
        tier: "II",
        hold: "W"
      },
      {
        name: "faction_the_red_sashes",
        tier: "II",
        hold: "W"
      },
      {
        name: "faction_the_dimmer_sisters",
        tier: "II",
        hold: "S"
      },
      {
        name: "faction_the_grinders",
        tier: "II",
        hold: "W"
      },
      {
        name: "faction_the_billhooks",
        tier: "II",
        hold: "W"
      },
      {
        name: "faction_the_wraiths",
        tier: "II",
        hold: "W"
      },
      {
        name: "faction_the_gray_cloaks",
        tier: "II",
        hold: "S"
      },
      {
        name: "faction_ulf_ironborn",
        tier: "I",
        hold: "S"
      },
      {
        name: "faction_the_foghounds",
        tier: "I",
        hold: "W"
      },
      {
        name: "faction_the_lost",
        tier: "I",
        hold: "W"
      }
    ],
    factions2: [
      {
        name: "faction_imperial_military",
        tier: "VI",
        hold: "S"
      },
      {
        name: "faction_city_council",
        tier: "V",
        hold: "S"
      },
      {
        name: "faction_ministry_of_preservation",
        tier: "V",
        hold: "S"
      },
      {
        name: "faction_leviathan_hunters",
        tier: "V",
        hold: "S"
      },
      {
        name: "faction_ironhook_prison",
        tier: "IV",
        hold: "S"
      },
      {
        name: "faction_sparkwrights",
        tier: "IV",
        hold: "S"
      },
      {
        name: "faction_spirit_wardens",
        tier: "IV",
        hold: "S"
      },
      {
        name: "faction_bluecoats",
        tier: "III",
        hold: "S"
      },
      {
        name: "faction_inspectors",
        tier: "III",
        hold: "S"
      },
      {
        name: "faction_iruvian_consulate",
        tier: "III",
        hold: "S"
      },
      {
        name: "faction_skovlan_consulate",
        tier: "III",
        hold: "W"
      },
      {
        name: "faction_the_brigade",
        tier: "II",
        hold: "S"
      },
      {
        name: "faction_severosi_consulate",
        tier: "I",
        hold: "S"
      },
      {
        name: "faction_dagger_isles_consulate",
        tier: "I",
        hold: "S"
      }
    ],
    factions3: [
      {
        name: "faction_the_foundation",
        tier: "IV",
        hold: "S"
      },
      {
        name: "faction_dockers",
        tier: "III",
        hold: "S"
      },
      {
        name: "faction_gondoliers",
        tier: "III",
        hold: "S"
      },
      {
        name: "faction_sailors",
        tier: "III",
        hold: "W"
      },
      {
        name: "faction_laborers",
        tier: "III",
        hold: "W"
      },
      {
        name: "faction_cabbies",
        tier: "II",
        hold: "W"
      },
      {
        name: "faction_cyphers",
        tier: "II",
        hold: "S"
      },
      {
        name: "faction_ink_rakes",
        tier: "II",
        hold: "W"
      },
      {
        name: "faction_rail_jacks",
        tier: "II",
        hold: "W"
      },
      {
        name: "faction_servants",
        tier: "II",
        hold: "W"
      }
    ],
    factions4: [
      {
        name: "faction_the_church_of_ecstasy",
        tier: "IV",
        hold: "S"
      },
      {
        name: "faction_the_horde",
        tier: "III",
        hold: "S"
      },
      {
        name: "faction_the_path_of_echoes",
        tier: "III",
        hold: "S"
      },
      {
        name: "faction_the_forgotten_gods",
        tier: "III",
        hold: "W"
      },
      {
        name: "faction_the_reconciled",
        tier: "III",
        hold: "S"
      },
      {
        name: "faction_skovlander_refugees",
        tier: "III",
        hold: "W"
      },
      {
        name: "faction_the_weeping_lady",
        tier: "II",
        hold: "S"
      },
      {
        name: "faction_deathlands_scavengers",
        tier: "II",
        hold: "W"
      }
    ],
    factions5: [
      {
        name: "faction_whitecrown",
        tier: "V",
        hold: "S"
      },
      {
        name: "faction_brightstone",
        tier: "IV",
        hold: "S"
      },
      {
        name: "faction_charterhall",
        tier: "IV",
        hold: "S"
      },
      {
        name: "faction_six_towers",
        tier: "III",
        hold: "W"
      },
      {
        name: "faction_silkshore",
        tier: "II",
        hold: "S"
      },
      {
        name: "faction_nightmarket",
        tier: "II",
        hold: "S"
      },
      {
        name: "faction_crow's_foot",
        tier: "II",
        hold: "S"
      },
      {
        name: "faction_the_docks",
        tier: "II",
        hold: "S"
      },
      {
        name: "faction_barrowcleft",
        tier: "II",
        hold: "S"
      },
      {
        name: "faction_coalridge",
        tier: "II",
        hold: "W"
      },
      {
        name: "faction_charhollow",
        tier: "I",
        hold: "S"
      },
      {
        name: "faction_dunslough",
        tier: "I",
        hold: "W"
      }
    ]
  };
  const actionData = {
    insight: [
      "finesse",
      "navigate",
      "patch",
      "scan"
    ],
    prowess: [
      "blast",
      "brawl",
      "skulk",
      "vault"
    ],
    resolve: [
      "attune",
      "command",
      "consort",
      "sway"
    ]
  };
  const traumaData = {
    normal: ["cold", "haunted", "obsessed", "paranoid", "reckless", "soft", "unstable", "vicious"],
    ghost: ["chaotic", "destructive", "furious", "obsessive", "territorial", "savage"],
    hull: ["clanking", "leaking", "fixated", "smoking", "sparking", "unstable"],
    vampire: ["cold", "haunted", "obsessed", "paranoid", "ruthless", "secretive", "unstable", "vicious"]
  };
  const itemData = [
    {
      name: "a_blade_or_two",
      description: "a_blade_or_two_description",
      numboxes: "1"
    },
    {
      name: "throwing_knives",
      description: "throwing_knives_description",
      numboxes: "1"
    },
    {
      name: "a_pistol",
      description: "a_pistol_description",
      numboxes: "1",
      short: "1"
    },
    {
      name: "a_2nd_pistol",
      description: "a_pistol_description",
      numboxes: "1",
      short: "1"
    },
    {
      name: "a_large_weapon",
      description: "a_large_weapon_description",
      numboxes: "2"
    },
    {
      name: "an_unusual_weapon",
      description: "an_unusual_weapon_description",
      numboxes: "1"
    },
    {
      name: "armor",
      description: "armor_description",
      numboxes: "2",
      short: "1"
    },
    {
      name: "+heavy",
      description: "+heavy_description",
      numboxes: "3",
      short: "1"
    },
    {
      name: "burglary_gear",
      description: "burglary_gear_description",
      numboxes: "1"
    },
    {
      name: "climbing_gear",
      description: "climbing_gear_description",
      numboxes: "2"
    },
    {
      name: "arcane_implements",
      description: "arcane_implements_description",
      numboxes: "1"
    },
    {
      name: "documents",
      description: "documents_description",
      numboxes: "1"
    },
    {
      name: "subterfuge_supplies",
      description: "subterfuge_supplies_description",
      numboxes: "1"
    },
    {
      name: "demolition_tools",
      description: "demolition_tools_description",
      numboxes: "2"
    },
    {
      name: "tinkering_tools",
      description: "tinkering_tools_description",
      numboxes: "1"
    },
    {
      name: "lantern",
      description: "lantern_description",
      numboxes: "1"
    }
  ];
  const translatedDefaults = {
    char_cohort_name: "cohort",
    cohort1_name: "cohort",
    contacts_title: "contacts",
    factions_title: "factions_title",
    factions1_header: "factions1",
    factions2_header: "factions2",
    factions3_header: "factions3",
    factions4_header: "factions4",
    factions5_header: "factions5",
    frame: "frame",
    friends_title: "friends",
    setting_alchemicals_label: "alchemicals",
    setting_deity_label: "deity",
    setting_heat_label: "heat",
    setting_stress_label: "stress",
    setting_trauma_label: "trauma",
    setting_wanted_label: "wanted",
    special_abilities_title: "special_abilities",
    upgrade_carriage_name: "carriage",
    upgrade_carriage_description: "upgrade_carriage_description",
    upgrade_documents_name: "documents",
    upgrade_documents_description: "upgrade_documents_description",
    upgrade_boat_name: "boat",
    upgrade_boat_description: "upgrade_boat_description",
    upgrade_gear_name: "gear",
    upgrade_gear_description: "upgrade_gear_description",
    upgrade_hidden_name: "hidden",
    upgrade_hidden_description: "upgrade_hidden_description",
    upgrade_implements_name: "implements",
    upgrade_implements_description: "upgrade_implements_description",
    upgrade_quarters_name: "quarters",
    upgrade_quarters_description: "upgrade_quarters_description",
    upgrade_supplies_name: "supplies",
    upgrade_supplies_description: "upgrade_supplies_description",
    upgrade_secure_name: "secure",
    upgrade_secure_description: "upgrade_secure_description",
    upgrade_tools_name: "tools",
    upgrade_tools_description: "upgrade_tools_description",
    upgrade_vault_name: "vault",
    upgrade_vault_description: "upgrade_vault_description",
    upgrade_weapons_name: "weapons",
    upgrade_weapons_description: "upgrade_weapons_description",
    upgrade_workshop_name: "workshop",
    upgrade_workshop_description: "upgrade_workshop_description",
    upgrade_insight_name: "insight",
    upgrade_insight_description: "upgrade_insight_description",
    upgrade_prowess_name: "prowess",
    upgrade_prowess_description: "upgrade_prowess_description",
    upgrade_resolve_name: "resolve",
    upgrade_resolve_description: "upgrade_resolve_description",
    upgrade_personal_name: "personal",
    upgrade_personal_description: "upgrade_personal_description",
    upgrade_mastery_name: "mastery",
    upgrade_mastery_description: "upgrade_mastery_description",
    xp_condition2: "xp_beliefs",
    xp_condition3: "xp_vice"
  };
  const defaultValues = {
    attune: "0",
    char_cohort_quality: "1",
    char_cohort_type: "expert",
    claim_bridge_10_15: "1",
    claim_bridge_12_13: "1",
    claim_bridge_13_14: "1",
    claim_bridge_2_3: "1",
    claim_bridge_2_7: "1",
    claim_bridge_3_4: "1",
    claim_bridge_4_9: "1",
    claim_bridge_6_11: "1",
    claim_bridge_6_7: "1",
    claim_bridge_9_14: "1",
    cohort1_subtype: "",
    cohort1_type: "gang",
    command: "0",
    consort: "0",
    finesse: "0",
    hunt: "0",
    prowl: "0",
    setting_extra_stress: "0",
    setting_load_h: "6",
    setting_show_bandolier: "0",
    setting_show_cohort: "0",
    setting_show_deity: "0",
    setting_show_frame: "0",
    setting_show_loyalty: "0",
    setting_show_purpose: "0",
    setting_show_strictures: "0",
    setting_traumata_set: "normal",
    setting_vampirexp: "0",
    setting_vice_type: "normal",
    skirmish: "0",
    study: "0",
    survey: "0",
    sway: "0",
    tinker: "0",
    trauma: "0",
    upgrade_hidden_check_1: "0",
    upgrade_secure_check_1: "0",
    upgrade_insight_check_1: "0",
    upgrade_prowess_check_1: "0",
    upgrade_resolve_check_1: "0",
    upgrade_carriage_check_1: "0",
    wreck: "0"
  };
  const spiritPlaybooks = ["ghost", "hull", "vampire"];
  const alchemicalData = [
    "alcahest",
    "binding_oil",
    "drift_oil",
    "drown_powder",
    "eyeblind_poison",
    "fire_oil",
    "grenade",
    "quicksilver",
    "skullfire_poison",
    "smoke_bomb",
    "spark_drug",
    "standstill_poison",
    "trance_powder",
  ];

  /* PRE-COMPUTED CONSTANTS */
  const [playbookAbilityMap, crewAbilityMap] = dataSetup();
  const crewAttributes = [...new Set(
    [].concat(...Object.keys(crewData).map(x => Object.keys(crewData[x].base)))
  )];
  const playbookAttributes = [...new Set(
    [].concat(...Object.keys(playbookData)
      .map(x => Object.keys(playbookData[x].base)))
  )];
  const watchedAttributes =
    [...new Set(crewAttributes.concat(playbookAttributes))];
  const actionsFlat =
    [].concat(...Object.keys(actionData).map(x => actionData[x]));
  const traumaDataFlat = Object.keys(traumaData)
    .reduce((m, k) => m.concat(traumaData[k]), []);
  const autoExpandFields = [
    "repeating_ability:name",
    "repeating_ability:description",
    "repeating_crewability:name",
    "repeating_crewability:description",
    "repeating_playbookitem:name",
    "repeating_upgrade:name",
    "repeating_friend:name",
    "repeating_contact:name",
    "repeating_clock:name",
    "repeating_crewclock:name",
    "repeating_factionclock:name",
    "repeating_cohort:edges",
    "repeating_cohort:flaws",
    "repeating_alchemical:name",
    "xp_condition",
    "xp_condition_extra",
    "xp_condition2",
    "xp_condition3",
    "crew_xp_condition",
    "hunting_grounds_type",
    "hunting_grounds_description",
    "cohort1_edges",
    "cohort1_flaws",
    "heritage",
    "background",
    "vice_purveyor",
  ];
  const autogenSections = [
    "ability",
    "crewability",
    "friend",
    "contact",
    "playbookitem",
    "upgrade"
  ];
  const translatedNames = [
    ...Object.keys(playbookData),
    ...Object.keys(crewData)
  ].reduce((m, keyName) => {
    if (getTranslationByKey(keyName)) {
      m[getTranslationByKey(keyName).toLowerCase()] = keyName;
    }
    return m;
  }, {});

  /* EVENT HANDLERS */
  /* Set default fields when setting crew type or playbook */
  on("change:crew_type change:playbook", handlePlaybookFill);
  /* automatically fill abilities */
  on("change:repeating_ability:name",
    () => fillAbility("repeating_ability", playbookAbilityMap));
  on("change:repeating_crewability:name",
    () => fillAbility("repeating_crewability", crewAbilityMap));
  /* Watch repeating rows for changes and set autogen to false if it changes */
  autogenSections.forEach(watchAutogen);
  /* Watch for changes in auto-set attributes and update changed_attributes */
  on(watchedAttributes.map(x => `change:${x}`).join(" "), updateChangedAttrs);
  /* Register attribute/action event handlers */
  Object.keys(actionData).forEach(attrName => {
    on([...actionData[attrName], `setting_resbonus_${attrName}`]
      .map(x => `change:${x}`).join(" "), () => calculateResistance(attrName)
    );
    on(`change:setting_dark_talent_${attrName}`,
      () => handleDarkTalentChange(attrName));
    on(`change:${attrName}`, calculateVice);
  });
  /* Calculate stash */
  on("change:stash", calculateStashFormula);
  on("change:wanted", calculateWantedFormula);
  /* Calculate trauma */
  on("change:setting_traumata_set " +
    traumaDataFlat.map(x => `change:trauma_${x}`).join(" "), calculateTrauma);
  /* Generate buttons */
  on("change:generate_factions", generateFactions);
  autogenSections.forEach(handleRepeatingGenerateButton);
  /* Extra stress and trauma */
  on("change:setting_extra_stress", event =>
    setAttr("stress_max", 9 + (parseInt(event.newValue) || 0)));
  on("change:setting_extra_trauma", event =>
    setAttr("trauma_max", 4 + (parseInt(event.newValue) || 0)));
  /* Calculate cohort quality */
  on(
    ["crew_tier", "cohort1_impaired", "cohort1_type"]
      .map(x => `change:${x}`).join(" "),
    () => calculateCohortDice(["cohort1"]));
  on("change:repeating_cohort",
    () => calculateCohortDice(["repeating_cohort"]));
  on("change:crew_tier", () => {
    getSectionIDs("repeating_cohort",
      a => calculateCohortDice(a.map(id => `repeating_cohort_${id}`)));
  });
  on("change:char_cohort_quality change:char_cohort_impaired " +
    "change:setting_show_cohort", calculateCharCohortDice);
  /* Set correct verb for cohort roll button */
  ["char_cohort", "cohort1", "repeating_cohort"].forEach(handleCohortVerb);
  /* Left-fill checkboxes */
  handleBoxesFill("upgrade_mastery_check_", true);
  handleBoxesFill("bandolier1_check_");
  handleBoxesFill("bandolier2_check_");
  ["item", "playbookitem", "upgrade"]
    .forEach(sName => handleBoxesFill(`repeating_${sName}:check_`));
  /* Pseudo-radios */
  ["crew_tier", ...actionsFlat].forEach(handlePseudoRadio);
  /* Item reset button */
  on("change:reset_items", resetItems);
  /* Resistance query */
  on("change:setting_consequence_query sheet:opened", handleConsequenceQuery);
  /* Trim whitespace in auto-expand fields */
  autoExpandFields.forEach(handleAutoExpandWhitespace);
  /* Clean chat image URL */
  on("change:chat_image", cleanChatImage);
  /* Number of dice prompt and other translation-dependent atoms */
  on("sheet:opened change:setting_usekirsty change:setting_custom_actions",
    setupTranslatedAttrs);
  on("change:setting_custom_actions", setRollMods);
  /* INITIALISATION AND UPGRADES */
  on("sheet:opened", handleSheetInit);
})();
