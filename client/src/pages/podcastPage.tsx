import {CircularProgress, Typography} from '@material-ui/core';
import {makeStyles} from '@material-ui/core/styles';
import * as React from 'react';
import {useEffect, useState} from 'react';
import {useParams} from 'react-router';
import {getPodcast} from '../api';
import {ShowInfo} from '../components/showCard';

const useStyles = makeStyles({
  root: {
    margin: '10px',
    textAlign: 'center'
  },
  loadingSpinner: {
    padding: '50px'
  }
});

export const PodcastPage = () => {
  const classes = useStyles();
  const params = useParams<{podcastNum: string}>();

  const [podcast, setPodcast] = useState<ShowInfo | null | undefined>(undefined);

  useEffect(() => {
    getPodcast(parseInt(params.podcastNum))
      .then(setPodcast)
      .catch(() => setPodcast(null));
  }, []);

  if (podcast === undefined) {
    return (
      <div className={classes.root}>
        <CircularProgress className={classes.loadingSpinner} size={100}/>
      </div>
    );
  }

  if (podcast === null) {
    return (
      <div className={classes.root}>
        <Typography variant='h2'>
          404 - Podcast does not exist
        </Typography>
      </div>
    );
  }

  return (
    <div className={classes.root}>
      <Typography>
        {podcast.title}
      </Typography>
    </div>
  );
};