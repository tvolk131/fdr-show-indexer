import {
  IconButton,
  InputBase,
  AccordionSummary,
  Accordion,
  AccordionDetails,
  Divider,
  Chip,
  CircularProgress,
  TextField
} from '@material-ui/core';
import {Autocomplete} from '@material-ui/lab';
import {createStyles, makeStyles, Theme} from '@material-ui/core/styles';
import {Search as SearchIcon, ExpandMore as ExpandMoreIcon, Close as CloseIcon} from '@material-ui/icons';
import * as React from 'react';
import {MouseEvent, useState, useEffect} from 'react';
import {getFilteredTagsWithCounts, searchPodcastsAutocomplete} from '../api';
import {getTagDisplayText} from '../helper/tagFormatting';

const useStyles = makeStyles((theme: Theme) => (
  createStyles({
    root: {
      padding: '2px 4px',
      display: 'flex',
      alignItems: 'center'
    },
    autocomplete: {
      marginLeft: 8,
      flex: 1
    },
    inputBaseRoot: {
      width: '100%'
    },
    inputBaseInput: {
      padding: '12px 0'
    },
    iconButton: {
      padding: 10
    },
    verticalDivider: {
      margin: '0 5px'
    },
    tagChip: {
      margin: theme.spacing(0.5)
    },
    tagSearchFieldWrapper: {
      display: 'block',
      textAlign: 'center',
      paddingBottom: theme.spacing(0.5)
    },
    advancedSearchWrapper: {
      width: '100%'
    },
    accordionSummaryContent: {
      margin: '8px 0'
    }
  })
));

const maxVisibleTags = 50;

interface SearchBarProps {
  onSearch: (forceOverrideSearchText?: string) => void
  searchText: string
  setSearchText: (query: string) => void
  searchTags: string[]
  setSearchTags: (tags: string[]) => void
}

const SearchBar = (props: SearchBarProps) => {
  const [tagFilter, setTagFilter] = useState('');
  const [tagsWithCounts, setTagsWithCounts] = useState<{tag: string, count: number}[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<string[]>([]);

  const handleSearch = (forceOverrideSearchText?: string) => {
    props.onSearch(forceOverrideSearchText);
    props.setSearchTags(props.searchTags);
    setIsLoadingTags(true);
    getFilteredTagsWithCounts({
      query: typeof forceOverrideSearchText === 'string' ? forceOverrideSearchText : props.searchText,
      tags: props.searchTags
    }).then((tagsWithCounts) => {
      tagsWithCounts.sort((a, b) => {
        if (a.count < b.count) {
          return 1;
        } else if (a.count > b.count) {
          return -1;
        } else if (a.tag > b.tag) {
          return 1;
        } else if (a.tag < b.tag) {
          return -1;
        } else {
          return 0;
        }
      });
      setTagsWithCounts(tagsWithCounts);
      setIsLoadingTags(false);
    });
  }

  const handleSearchIfSearchTextNotEmpty = () => {
    if (props.searchText.length) {
      handleSearch();
    }
  };

  useEffect(handleSearch, [props.searchTags]);

  useEffect(() => {
    // TODO - Don't make a new request on every single change.
    // This causes rendering slowdowns when typing very fast.
    searchPodcastsAutocomplete(props.searchText).then(setAutocompleteSuggestions);
  }, [props.searchText]);

  const handleMouseDownSearch = (event: MouseEvent) => {
    event.preventDefault();
  };

  const classes = useStyles();

  const getSelectableTagChips = () => {
    const filteredTags = tagsWithCounts.filter(({tag}) => (
      getTagDisplayText(tag).toLowerCase().includes(tagFilter.toLowerCase())
    ))

    const tagChips = filteredTags.slice(0, maxVisibleTags).map(({tag, count}) => (
      <Chip
        onClick={() => props.setSearchTags([...props.searchTags, tag])}
        className={classes.tagChip}
        label={`${getTagDisplayText(tag)} (${count})`}
      />
    ));

    const nonVisibleTagCount = filteredTags.length - maxVisibleTags;

    if (nonVisibleTagCount > 0) {
      tagChips.push(<Chip label={`... +${nonVisibleTagCount}`}/>);
    }

    return tagChips;
  };

  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon/>} classes={{content: classes.accordionSummaryContent}}>
        <div
          onClick={(event) => event.stopPropagation()}
          onFocus={(event) => event.stopPropagation()}
          style={{
            width: '100%',
            display: 'flex'
          }}
        >
          <Autocomplete
            freeSolo
            options={autocompleteSuggestions}
            className={classes.autocomplete}
            onClose={(event, reason) => {
              if (reason === 'select-option') {
                handleSearch();
              }
            }}
            inputValue={props.searchText}
            onInputChange={(event, value, reason) => {
              if (!(value.length === 0 && reason === 'reset')) {
                props.setSearchText(value);
              }
            }}
            renderInput={(params: any) => (
              <div ref={params.InputProps.ref}>
                <InputBase
                  classes={{root: classes.inputBaseRoot, input: classes.inputBaseInput}}
                  placeholder='Search Freedomain Videos'
                  onKeyPress={(event) => {
                    if (event.key === 'Enter') {
                      handleSearchIfSearchTextNotEmpty();
                    }
                  }}
                  onSubmit={handleSearchIfSearchTextNotEmpty}
                  {...params.inputProps}
                />
              </div>
            )}
          />
          {!!props.searchText.length && (
            <IconButton
              className={classes.iconButton}
              onMouseDown={handleMouseDownSearch}
              onClick={() => {
                props.setSearchText('');
                handleSearch('');
              }}
            >
              <CloseIcon/>
            </IconButton>
          )}
          {!!props.searchText.length && <Divider className={classes.verticalDivider} orientation={'vertical'}/>}
          <IconButton
            className={classes.iconButton}
            onMouseDown={handleMouseDownSearch}
            onClick={handleSearchIfSearchTextNotEmpty}
          >
            <SearchIcon/>
          </IconButton>
          {!!props.searchTags.length && props.searchTags.map((tag) => (
            <Chip
              onDelete={() => props.setSearchTags(props.searchTags.filter((iterTag) => tag !== iterTag))}
              className={classes.tagChip}
              label={getTagDisplayText(tag)}
            />
          ))}
        </div>
      </AccordionSummary>
      <Divider/>
      <AccordionDetails>
        <div className={classes.advancedSearchWrapper}>
          <div className={classes.tagSearchFieldWrapper}>
            <TextField value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} label={'Tag Filter'}/>
          </div>
          {isLoadingTags ? <CircularProgress/> : getSelectableTagChips()}
        </div>
      </AccordionDetails>
    </Accordion>
  );
};

export default SearchBar;