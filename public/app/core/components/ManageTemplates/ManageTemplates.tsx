/**
 * ManageTemplates
 *
 * React port of ManageTemplatesCtrl + manage_templates.html.
 * Replaces Angular directive: <manage-templates>
 *
 * Features: search, category/type filters, select-all, bulk delete,
 * bulk move, edit template - using SearchResults (already React) for the list.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import _ from 'lodash';
import config from 'app/core/config';
import { SearchResults } from '../Search/SearchResults';
import { Switch } from '../Switch/Switch';
import { useAngularService } from 'app/core/hooks/useAngularService';
import appEvents from 'app/core/app_events';
import { contextSrv } from 'app/core/services/context_srv';
import {
  CategoryRet,
  PanelTemplate,
  TemplateType,
  getUniqueList,
} from 'app/core/services/backendapi_srv';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FILTER_BY_CATEGORY = 'Filter By Category';
const FILTER_BY_TYPE = 'Filter By Type';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CategoryItem {
  expanded: boolean;
  icon: string;
  id: number;
  items: PanelTemplate[];
  toggle: (c: CategoryItem) => Promise<CategoryItem>;
  title: string;
  score: number;
  checked: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildCategories(templates: PanelTemplate[]): CategoryItem[] {
  let idCounter = 0;

  const categoryMap = templates.reduce<Record<string, CategoryItem>>((acc, t) => {
    const key = t.category || '';
    if (!acc[key]) {
      acc[key] = {
        title: key,
        id: idCounter++,
        expanded: false,
        icon: 'fa fa-folder',
        items: [],
        score: 1,
        checked: false,
        toggle: async (cat) => {
          cat.expanded = !cat.expanded;
          cat.icon = cat.expanded ? 'fa fa-folder-open' : 'fa fa-folder';
          return cat;
        },
      };
    }
    acc[key].items.push({ ...t, checked: false } as any);
    return acc;
  }, {});

  const sorted = Object.values(categoryMap).sort((a, b) =>
    a.title.toUpperCase() > b.title.toUpperCase() ? 1 : -1
  );

  sorted.forEach(cat => {
    cat.items.sort((a, b) =>
      (a.name || '').toUpperCase() > (b.name || '').toUpperCase() ? 1 : -1
    );
  });

  if (sorted.length > 0) sorted[0].expanded = true;

  return sorted;
}

function buildPluginsMap(): Record<string, string> {
  const panels = _.chain(config.panels)
    .filter({ hideFromList: false })
    .value();

  return panels.reduce<Record<string, string>>((acc, obj: any) => {
    if (!acc[obj.name]) acc[obj.name] = obj.info?.logos?.small ?? '';
    return acc;
  }, {});
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ManageTemplates: React.FC = () => {
  const backendApiSrv = useAngularService<any>('backendApiSrv');

  const isEditor                      = contextSrv.isEditor;
  const hasEditPermissionInCategories = (contextSrv as any).hasEditPermissionInCategories;

  // -- State -----------------------------------------------------------------

  const [allTemplates, setAllTemplates]           = useState<PanelTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<PanelTemplate[]>([]);
  const [sections, setSections]                   = useState<CategoryItem[]>([]);
  const [selectedTemplates, setSelectedTemplates] = useState<PanelTemplate[]>([]);
  const [selectAll, setSelectAll]                 = useState(false);
  const [canMove, setCanMove]                     = useState(false);
  const [canDelete, setCanDelete]                 = useState(false);
  const [hasFilters, setHasFilters]               = useState(false);
  const [queryText, setQueryText]                 = useState('');
  const [plugins, setPlugins]                     = useState<Record<string, string>>({});

  const [categoryOptions, setCategoryOptions]     = useState<CategoryRet[]>([{ text: FILTER_BY_CATEGORY }]);
  const [selectedCategory, setSelectedCategory]   = useState(FILTER_BY_CATEGORY);
  const [typeOptions, setTypeOptions]             = useState<TemplateType[]>([{ text: FILTER_BY_TYPE }]);
  const [selectedType, setSelectedType]           = useState(FILTER_BY_TYPE);

  const searchDebounce = useRef<ReturnType<typeof setTimeout>>();

  // -- Initial load ----------------------------------------------------------

  useEffect(() => {
    backendApiSrv.getTemplates(contextSrv).then((list: PanelTemplate[]) => {
      const userOnly = contextSrv.user.isGrafanaAdmin
        ? list
        : list.filter(t => t.owner === contextSrv.user.login);

      setAllTemplates(userOnly);
      setFilteredTemplates(userOnly);
      setPlugins(buildPluginsMap());

      // Build filter options
      const catList = getUniqueList(userOnly, 'category' as any).map(c => ({ text: c as string }));
      catList.sort((a, b) => a.text.toUpperCase() > b.text.toUpperCase() ? 1 : -1);
      setCategoryOptions([{ text: FILTER_BY_CATEGORY }, ...catList]);

      const typeList = getUniqueList(userOnly, 'type' as any).map(t => ({ text: t as string }));
      setTypeOptions([{ text: FILTER_BY_TYPE }, ...typeList]);

      setSections(buildCategories(userOnly));
    }).catch(() => {
      appEvents.emit('alert-error', ['Templates failed', 'No templates found']);
    });
  }, [backendApiSrv]);

  // -- Apply filters + search ------------------------------------------------

  const applyFilters = useCallback((
    templates: PanelTemplate[],
    query: string,
    category: string,
    type: string
  ) => {
    let result = [...templates];

    if (category !== FILTER_BY_CATEGORY) {
      result = result.filter(t => t.category?.includes(category));
    }
    if (type !== FILTER_BY_TYPE) {
      result = result.filter(t => t.type?.includes(type));
    }
    if (query.trim()) {
      const words = query.trim().split(/\s+/);
      words.forEach(word => {
        const re = new RegExp(word.trim(), 'gi');
        result = result.filter(t =>
          re.test(t.category || '') || re.test(t.name) ||
          re.test(t.description) || re.test(t.owner) ||
          re.test(t.access || '') || re.test(t.type || '')
        );
      });
    }

    setFilteredTemplates(result);
    setSections(buildCategories(result));
    setHasFilters(query.trim().length > 0 || category !== FILTER_BY_CATEGORY || type !== FILTER_BY_TYPE);
    setSelectAll(false);
    setSelectedTemplates([]);
    setCanMove(false);
    setCanDelete(false);
  }, []);

  const handleQueryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQueryText(val);
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => applyFilters(allTemplates, val, selectedCategory, selectedType), 500);
  }, [allTemplates, selectedCategory, selectedType, applyFilters]);

  const handleCategoryChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const cat = e.target.value;
    setSelectedCategory(cat);
    applyFilters(allTemplates, queryText, cat, selectedType);
  }, [allTemplates, queryText, selectedType, applyFilters]);

  const handleTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value;
    setSelectedType(type);
    applyFilters(allTemplates, queryText, selectedCategory, type);
  }, [allTemplates, queryText, selectedCategory, applyFilters]);

  const clearFilters = useCallback(() => {
    setQueryText('');
    setSelectedCategory(FILTER_BY_CATEGORY);
    setSelectedType(FILTER_BY_TYPE);
    applyFilters(allTemplates, '', FILTER_BY_CATEGORY, FILTER_BY_TYPE);
  }, [allTemplates, applyFilters]);

  // -- Selection -------------------------------------------------------------

  const handleToggleSelection = useCallback((item: any) => {
    item.checked = !item.checked;

    let newSelected = [...selectedTemplates];

    if (item.items) {
      // Category toggle
      item.items.forEach((t: any) => {
        t.checked = item.checked;
        if (item.checked) {
          if (!newSelected.find(s => s.id === t.id)) newSelected.push(t);
        } else {
          newSelected = newSelected.filter(s => s.id !== t.id);
        }
      });
    } else {
      if (item.checked) {
        if (!newSelected.find(s => s.id === item.id)) newSelected.push(item);
      } else {
        newSelected = newSelected.filter(s => s.id !== item.id);
      }
    }

    setSelectedTemplates(newSelected);
    setCanMove(newSelected.length > 0);
    setCanDelete(newSelected.length > 0);
    setSections([...sections]);
  }, [selectedTemplates, sections]);

  const handleSelectAll = useCallback(() => {
    const next = !selectAll;
    setSelectAll(next);
    const updated = sections.map(s => ({
      ...s,
      checked: next,
      items: s.items.map(i => ({ ...i, checked: next })),
    }));
    setSections(updated as CategoryItem[]);
    const newSelected = next ? [...filteredTemplates] : [];
    setSelectedTemplates(newSelected);
    setCanMove(newSelected.length > 0);
    setCanDelete(newSelected.length > 0);
  }, [selectAll, sections, filteredTemplates]);

  // -- Edit -----------------------------------------------------------------

  const canEditSelection = useCallback(() => {
    if (contextSrv.user.isGrafanaAdmin) return true;
    return selectedTemplates.some(t => t.owner === contextSrv.user.login);
  }, [selectedTemplates]);

  const handleEditSelected = useCallback((item: any) => {
    if (contextSrv.user.login !== item.owner && !contextSrv.user.isGrafanaAdmin) return;

    const { name, description, category } = item;
    const categories = categoryOptions.filter(c => c.text !== FILTER_BY_CATEGORY);
    const update = (templates: PanelTemplate[]) => {
      setAllTemplates(prev => prev.map(t => {
        const idx = templates.findIndex(u => u.id === t.id);
        return idx > -1 ? { ...templates[idx] } : { ...t };
      }));
    };

    appEvents.emit('show-modal', {
      templateHtml: '<save-as-template dismiss="dismiss()" template-name="model.templateName" template-description="model.templateDescription" categories="model.categories" public="model.public" editing=true data="model.data" template="model.template" category="model.category" after-save="model.afterSave($templates)"></save-as-template>',
      modalClass: 'modal--narrow',
      model: {
        templateName: name,
        templateDescription: description,
        categories,
        public: item.access === 'public',
        category: { title: category },
        data: item.data,
        template: item,
        afterSave: update,
      },
    });
  }, [categoryOptions]);

  // -- Bulk actions ----------------------------------------------------------

  const handleDelete = useCallback(() => {
    if (!canEditSelection()) {
      appEvents.emit('alert-error', ['Delete failed', 'Selected templates have a different owner']);
      return;
    }
    const count = selectedTemplates.length;
    appEvents.emit('confirm-modal', {
      title: 'Delete',
      text: `Do you want to delete the selected template${count === 1 ? '' : 's'}?`,
      text2: `${count} template${count === 1 ? '' : 's'} will be deleted`,
      icon: 'fa-trash',
      yesText: 'Delete',
      onConfirm: () => {
        backendApiSrv.deleteTemplate(selectedTemplates).then(() => {
          appEvents.emit('alert-success', ['Templates deleted', 'Selected template(s) are deleted']);
          setAllTemplates(prev => prev.filter(t => !selectedTemplates.find(s => s.id === t.id)));
          setSelectedTemplates([]);
          setCanMove(false);
          setCanDelete(false);
        }).catch((e: any) => {
          appEvents.emit('alert-error', ['Delete Failed', e]);
        });
      },
    });
  }, [canEditSelection, selectedTemplates, backendApiSrv]);

  const handleMoveTo = useCallback(() => {
    if (!canEditSelection()) {
      appEvents.emit('alert-error', ['Move failed', 'Selected templates have a different owner']);
      return;
    }
    const selectedCats = _.uniq(selectedTemplates.map(t => t.category));
    const available = categoryOptions
      .filter(c => !selectedCats.includes(c.text) && c.text !== FILTER_BY_CATEGORY)
      .sort((a, b) => a.text.toUpperCase() > b.text.toUpperCase() ? 1 : -1);

    const update = (templates: PanelTemplate[]) => {
      setAllTemplates(prev => prev.map(t => {
        const idx = templates.findIndex(u => u.id === t.id);
        return idx > -1 ? { ...templates[idx] } : { ...t };
      }));
    };

    appEvents.emit('show-modal', {
      templateHtml: '<move-to-category-modal dismiss="dismiss()" templates="model.templates" categories="model.categories" after-save="model.afterSave($templates)"></move-to-category-modal>',
      modalClass: 'modal--narrow',
      model: { templates: selectedTemplates, afterSave: update, categories: available },
    });
  }, [canEditSelection, selectedTemplates, categoryOptions]);

  // -- Render ----------------------------------------------------------------

  const hasResults = sections.length > 0;

  return (
    <div className="dashboard-list">
      {/* Search bar */}
      <div className="page-action-bar page-action-bar--narrow">
        <label className="gf-form gf-form--grow gf-form--has-input-icon">
          <input
            type="text"
            className="gf-form-input max-width-30"
            placeholder="Template search filter"
            tabIndex={1}
            spellCheck={false}
            value={queryText}
            onChange={handleQueryChange}
          />
          <i className="gf-form-input-icon fa fa-search" />
        </label>
        <div className="page-actionbar__spacer" />
        {isEditor && (
          <a className="btn btn-success" href="template/import">
            <i className="fa fa-plus" /> Import
          </a>
        )}
      </div>

      {/* Active filter clear */}
      {hasFilters && (
        <div className="page-action-bar page-action-bar--narrow">
          <div className="gf-form-inline">
            <div className="gf-form">
              <label className="gf-form-label">
                <a className="pointer" onClick={clearFilters} title="Clear current search query and filters">
                  <i className="fa fa-remove" />&nbsp;Clear
                </a>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Empty states */}
      {hasFilters && !hasResults && <div className="search-results"><em className="muted">No templates matching your query were found.</em></div>}
      {!hasFilters && !hasResults && <div className="search-results"><em className="muted">No templates found.</em></div>}

      {/* Filter row */}
      <div className="search-results">
        <div className="search-results-filter-row">
          <Switch
            label=""
            checked={selectAll}
            onChange={handleSelectAll}
            switchClass="gf-form-switch--transparent gf-form-switch--search-result-filter-row__checkbox"
          />
          <div className="search-results-filter-row__filters">
            {(canMove || canDelete) ? (
              <div className="gf-form-button-row">
                <button
                  type="button"
                  className="btn gf-form-button btn-inverse"
                  disabled={!canMove}
                  onClick={handleMoveTo}
                  title={canMove ? '' : 'Select a template to move'}
                >
                  <i className="fa fa-exchange" />&nbsp;&nbsp;Move
                </button>
                <button
                  type="button"
                  className="btn gf-form-button btn-danger"
                  disabled={!canDelete}
                  onClick={handleDelete}
                >
                  <i className="fa fa-trash" />&nbsp;&nbsp;Delete
                </button>
              </div>
            ) : (
              <>
                <span className="gf-form-select-wrapper">
                  <select
                    className="search-results-filter-row__filters-item gf-form-input gf-form-select-wrapper--category-filter"
                    value={selectedCategory}
                    onChange={handleCategoryChange}
                  >
                    {categoryOptions.map(opt => (
                      <option key={opt.text} value={opt.text}>{opt.text}</option>
                    ))}
                  </select>
                </span>
                <span className="gf-form-select-wrapper">
                  <select
                    className="search-results-filter-row__filters-item gf-form-input"
                    value={selectedType}
                    onChange={handleTypeChange}
                  >
                    {typeOptions.map(opt => (
                      <option key={opt.text} value={opt.text}>{opt.text}</option>
                    ))}
                  </select>
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      {hasResults && (
        <div className="search-results-container">
          <SearchResults
            results={sections as any}
            editable
            isTemplate
            onTagSelected={() => {}}
            onToggleSelection={handleToggleSelection}
            onEditSelected={handleEditSelected}
            getIcon={(item: any) => plugins[item.type] || 'public/img/icn-row.svg'}
            onHideMenu={() => {}}
          />
        </div>
      )}
    </div>
  );
};

export default ManageTemplates;
export { ManageTemplates };
