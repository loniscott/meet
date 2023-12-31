import React, { Component } from 'react';
import './App.css';
import EventList from './EventList';
import CitySearch from './CitySearch';
import NumberOfEvents from './NumberOfEvents';
import EventGenre from './EventGenre';
import { getEvents, extractLocations, checkToken, getAccessToken } from './api';
import './nprogress.css';
import WelcomeScreen from './WelcomeScreen';
import { ErrorAlert } from './Alert';
import { 
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

class App extends Component {
  state = {
    events: [],
    locations: [],
    eventCount: 32,
    selectedCity: null,
    isOnline: true,
    showWelcomeScreen: undefined,
  };


  updateEvents = (location, eventCount) => {
    if (!eventCount) {
    getEvents().then((events) => {
      const locationEvents = (location === 'all') ?
      events : 
      events.filter((event) => event.location === location);
      this.setState({
        events: locationEvents,
        selectedCity: location
      });
    });
  } else if (eventCount && !location) {
    getEvents().then((events) => {
      const locationEvents = events.filter((event) =>
        this.state.locations.includes(event.location));
      const shownEvents = locationEvents.slice(0, eventCount);
      this.setState({
        events: shownEvents,
        eventCount: eventCount
      });
    });
  } else if (this.state.selectedCity === "all") {
      getEvents().then((events) => {
        const locationEvents = events;
        const shownEvents = locationEvents.slice(0, eventCount);
        this.setState({
          events: shownEvents,
          eventCount: eventCount
        });
      });
  } else {
    getEvents().then((events) => {
      const locationEvents = this.state.locations === "all" ? events : events.filter((event) => this.state.selectedCity === event.location);
      const shownEvents = locationEvents.slice(0, eventCount);
      this.setState({
        events: shownEvents,
        eventCount: eventCount
      });
    });
  }};
  

  getData = () => {
    const {locations, events} = this.state;
    const data = locations.map((location) => {
      const number = events.filter((event) => event.location === location).length;
      const city = location.split(', ').shift()
      return {city, number};
    })
    return data;
  }

  async componentDidMount() {
    this.mounted = true;

    const accessToken = localStorage.getItem('access_token');
    const isTokenValid = (await checkToken(accessToken)).error ? false : true;
    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get('code');
    this.setState({ showWelcomeScreen: !(code || isTokenValid) });
    if ((code || isTokenValid) && this.mounted) {
    getEvents().then((events) => {
      if (this.mounted) {
        this.setState({ events: events, locations: extractLocations(events) });
  }
  });
  }
  } catch(err) {
    alert(err);
  };
  handleOnline = () => {
    this.setState({ isOnline: true });
  };

 handleOffline = () => {
   this.setState({ isOnline: false });
 };

 componentDidUpdate(prevState) {
   if(this.state.isOnline && !prevState.isOnline) {
     alert("Back online");
   } else if(!this.state.isOnline && !prevState.isOnline) {
     alert('You are offline');
   }
   window.addEventListener('online', this.handleOnline);
   window.addEventListener('offline', this.handleOffline);
 };

  componentWillUnmount = () => {
    this.mounted = false;
  };

  

    render() {
      console.log(this.state.isOnline)
      if (this.state.showWelcomeScreen === undefined) return <div className='App' />
    return (
      <div className="App">
        <WelcomeScreen showWelcomeScreen={this.state.showWelcomeScreen} getAccessToken={() => { getAccessToken() }} />
        <h1>Meet: A React App</h1>
        <h4>Choose your nearest city</h4>
        <CitySearch locations={this.state.locations} updateEvents={this.updateEvents} />
        <NumberOfEvents numberOfEvents={this.state.numberOfEvents} query={this.state.eventCount} updateEvents={this.updateEvents} />
        <ErrorAlert text={this.state.errorText} />
      <div className="data-vis-wrapper">
        <EventGenre events={this.state.events} /> 
        <ResponsiveContainer height={400} >
        <ScatterChart
          margin={{
          top: 20,
          right: 20,
          bottom: 10,
          left: 10,
          }}
        >
          <CartesianGrid />
          <XAxis dataKey="city" type="category" name="city" />
          <YAxis dataKey="number" type="number" name="number of events" />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
          <Scatter data={this.getData()} fill="#8884d8" />
        </ScatterChart>
        </ResponsiveContainer>
        </div>
        <EventList events={this.state.events} />
      </div>
    );
  }
};

export default App;
