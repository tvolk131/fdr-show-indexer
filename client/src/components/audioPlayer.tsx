import * as React from 'react';
import {useState, useEffect, useRef} from 'react';
import {Theme, createStyles, makeStyles, useTheme} from '@material-ui/core/styles';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import PauseIcon from '@material-ui/icons/Pause';
import Forward30Icon from '@material-ui/icons/Forward30';
import Replay10Icon from '@material-ui/icons/Replay10';
import {Slider, IconButton, Typography, Paper, CircularProgress} from '@material-ui/core';
import {ShowInfo} from './showCard';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
      bottom: '0%',
      width: '100%',
      position: 'sticky',
      flexDirection: 'column',
      borderRadius: 0,
      overflowX: 'clip'
    },
    details: {
      display: 'flex',
      flexFlow: 'wrap',
      overflow: 'auto'
    },
    content: {
      flex: '1 0 auto',
      padding: '15px'
    },
    cover: {
      width: 151
    },
    controls: {
      display: 'flex',
      alignItems: 'center',
      paddingRight: theme.spacing(2),
      position: 'relative'
    },
    playPauseIcon: {
      height: 38,
      width: 38
    },
    playPauseButtonProgress: {
      position: 'absolute',
      left: '59px'
    },
    sliderWrapper: {
      height: 0
    },
    slider: {
      top: '-15px',
      padding: '15px 0'
    }
  })
);

interface AudioPlayerProps {
  showInfo?: ShowInfo
  autoPlay: boolean
  showSnackbarMessage(message: string): void
}

export const AudioPlayer = (props: AudioPlayerProps) => {
  const classes = useStyles();
  const theme = useTheme();

  const [trackProgress, setTrackProgress] = useState(0);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [failedToLoad, setFailedToLoad] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const audioRef = useRef(new Audio(props.showInfo?.audioLink));
  const intervalRef = useRef<NodeJS.Timeout>();

	const startTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

	  intervalRef.current = setInterval(() => {
	    if (!audioRef.current.ended) {
	      setTrackProgress(audioRef.current.currentTime);
      }
	  }, 50);
	}

  useEffect(() => {
    audioRef.current.onplay = () => setIsPlaying(true);
    audioRef.current.onpause = () => setIsPlaying(false);
    audioRef.current.onplaying = () => setIsLoadingAudio(false);
    audioRef.current.onended = () => setIsPlaying(false);
  }, []);

  useEffect(() => {
    audioRef.current.onerror = () => {
      if (props.showInfo !== undefined) {
        setIsLoadingAudio(false);
        setFailedToLoad(true);
        props.showSnackbarMessage('Failed to load podcast. Try again or check devtools for details.');
      }
    };
  }, [props.showInfo]);

  useEffect(() => {
    if (isPlaying) {
      audioRef.current.play();
      startTimer();
    } else {
      audioRef.current.pause();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    audioRef.current.src = props.showInfo?.audioLink || '';
    setFailedToLoad(false);
    if (props.showInfo) {
      setIsLoadingAudio(true);
    }
    if (props.autoPlay) {
      setIsPlaying(true);
      audioRef.current.play();
    } else {
      setIsPlaying(false);
      audioRef.current.pause();
    }
  }, [props.showInfo?.audioLink]);

  const seekRelative = (seconds: number) => {
    audioRef.current.currentTime += seconds;
    setTrackProgress(audioRef.current.currentTime);
  };

  const disableControls = isLoadingAudio || failedToLoad || props.showInfo === undefined;

  return (
    <Paper className={classes.root}>
      <div className={classes.sliderWrapper}>
        <Slider
          className={classes.slider}
          min={0}
          max={audioRef.current.duration}
          value={trackProgress}
          onChange={(event, newValue) => {
            if (typeof(newValue) === 'number') {
              setTrackProgress(newValue);
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
              }
            }
          }}
          onChangeCommitted={(event, newValue) => {
            if (typeof(newValue) === 'number') {
              setTrackProgress(newValue);
              startTimer();
              audioRef.current.currentTime = newValue;
              setTrackProgress(audioRef.current.currentTime);
            }
          }}
        />
      </div>
      <div className={classes.details}>
        <div className={classes.content}>
          <Typography color={failedToLoad ? 'error' : 'inherit'} component='h5' variant='h5'>
            {props.showInfo ? props.showInfo.title : '-----'}
          </Typography>
          <Typography variant='subtitle1' color={failedToLoad ? 'error' : 'textSecondary'}>
            {props.showInfo ? props.showInfo.podcastNumber : '-----'}
          </Typography>
        </div>
        <div className={classes.controls}>
          <IconButton
            aria-label='previous'
            onClick={() => seekRelative(-10)}
            disabled={disableControls}
          >
            {theme.direction === 'rtl' ? <Forward30Icon/> : <Replay10Icon/>}
          </IconButton>
          <IconButton
            aria-label='play/pause'
            onClick={() => setIsPlaying(!isPlaying)}
            disabled={disableControls}
          >
            {
              isPlaying ? <PauseIcon className={classes.playPauseIcon}/>
                        : <PlayArrowIcon className={classes.playPauseIcon}/>
            }
          </IconButton>
          {isLoadingAudio && <CircularProgress className={classes.playPauseButtonProgress}/>}
          <IconButton
            aria-label='next'
            onClick={() => seekRelative(30)}
            disabled={disableControls}
          >
            {theme.direction === 'rtl' ? <Replay10Icon/> : <Forward30Icon/>}
          </IconButton>
        </div>
      </div>
    </Paper>
  );
}