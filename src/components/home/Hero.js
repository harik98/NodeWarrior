import React from 'react';
import { useHistory } from "react-router-dom";
import { useFirebaseUser } from '../../hooks/user';

function Hero() {
  const user = useFirebaseUser();
  const history = useHistory();

  const onClickHeroBtn = () => {
    if (user == null) {
      history.push('/signup');
    } else {
      history.push('/learn');
    }
  };

  const onClickHeroChevron = () => {
    const linkedList = document.getElementById('linked-list');
    if (linkedList != null) {
      document.getElementById('linked-list').scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="landing-hero-container">
      <h1>An interactive visualization platform for learning data structures.</h1>
      <button onClick={onClickHeroBtn} className="hero-btn">
        <span className="bold">Get Started</span> – It's free!
      </button>
      <span id="chevron" className="hero-circle" onClick={onClickHeroChevron}>
        <img src={require('./images/arrow-down.svg')} alt="Arrow Down Icon" />
      </span>
    </div>
  );
}

export default Hero;
