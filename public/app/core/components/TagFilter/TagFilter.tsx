// @ts-nocheck
import Select from 'react-select';
import IndicatorsContainer from 'app/core/components/Picker/IndicatorsContainer';
import NoOptionsMessage from 'app/core/components/Picker/NoOptionsMessage';
import React from 'react';
import ResetStyles from 'app/core/components/Picker/ResetStyles';
import { TagBadge } from './TagBadge';
import { TagOption } from './TagOption';
import { components } from 'react-select';

export interface Props {
  tags: string[];
  tagOptions: () => Promise<any[]>;
  onChange: (tags: string[]) => void;
}

interface State {
  options: Array<{ value: string; label: string; count: number }>;
  isLoading: boolean;
}

export class TagFilter extends React.Component<Props, State> {
  constructor(props) {
    super(props);
    this.state = { options: [], isLoading: false };
  }

  // ── Load tag options eagerly so we never depend on AsyncSelect timing ─────

  loadOptions() {
    const { tagOptions } = this.props;
    if (typeof tagOptions !== 'function') {
      console.warn('[TagFilter] tagOptions is not a function, skipping. Value:', tagOptions);
      return;
    }
    this.setState({ isLoading: true });
    Promise.resolve(tagOptions())
      .then((raw: any[]) => {
        const options = (raw || []).map(option => ({
          value: option.term,
          label: option.term,
          count: option.count,
        }));
        this.setState({ options, isLoading: false });
      })
      .catch((_err) => {
        this.setState({ isLoading: false });
      });
  }

  componentDidMount() {
    this.loadOptions();
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.tagOptions !== this.props.tagOptions) {
      this.loadOptions();
    }
  }

  onChange = (newTags: any[]) => {
    this.props.onChange((newTags || []).map(tag => tag.value));
  };

  render() {
    const { tags } = this.props;
    const { options, isLoading } = this.state;

    const value = tags.map(tag => ({ value: tag, label: tag, count: 0 }));

    return (
      <div className="gf-form gf-form--has-input-icon gf-form--grow">
        <div className="tag-filter">
          <Select
            classNamePrefix="gf-form-select-box"
            isMulti={true}
            isLoading={isLoading}
            options={options}
            onChange={this.onChange}
            className="gf-form-input gf-form-input--form-dropdown"
            placeholder="Tags"
            noOptionsMessage={() => 'No tags found'}
            loadingMessage={() => 'Loading...'}
            getOptionValue={i => i.value}
            getOptionLabel={i => i.label}
            value={value}
            styles={ResetStyles}
            filterOption={(option, searchQuery) => {
              if (!searchQuery) { return true; }
              const regex = new RegExp(searchQuery, 'i');
              return regex.test(option.value);
            }}
            components={{
              Option: TagOption,
              IndicatorsContainer,
              NoOptionsMessage,
              MultiValueLabel: () => null,
              MultiValueRemove: props => {
                const { data } = props;
                return (
                  <components.MultiValueRemove {...props}>
                    <TagBadge key={data.label} label={data.label} removeIcon={true} count={data.count} />
                  </components.MultiValueRemove>
                );
              },
            }}
          />
        </div>
        <i className="gf-form-input-icon fa fa-tag" />
      </div>
    );
  }
}
