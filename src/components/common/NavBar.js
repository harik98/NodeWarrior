import React from 'react';

/**
 * Required Props:
 * brandTitle {string} - String representing the website brand name
 * TODO: Include other nav bar links
 */
function NavBar(props) {
  const { brandTitle } = props;

  return (
    <div className="nav-bar-container">
      <div className="nav-back-btn">
        <svg className="hamburger-icon">
          <use xlinkHref="/website-icons.svg#hamburger-icon"></use>
        </svg>
        <a href="/">3. Linked List Insertion</a>
      </div>
      <h1><a href="/">{brandTitle}</a></h1>
      <div className="nav-links-container">
        {/* <div className="user-account-circle"></div> */}
        <a href="/">Account</a>
      </div>
    </div>
  );
}

export default NavBar;
