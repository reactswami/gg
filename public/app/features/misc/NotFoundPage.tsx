/**
 * NotFoundPage
 *
 * React 404 page — catch-all route in the React router.
 * Replaces ErrorCtrl + error.html for routes handled by React.
 */

import React from 'react';
import { useHistory } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  const history = useHistory();

  return (
    <div className="page-container page-body">
      <div className="page-header-canvas">
        <div className="page-container">
          <div className="page-header">
            <div className="page-header__inner">
              <div className="page-header__info-block">
                <h1 className="page-header__title">Page not found</h1>
                <div className="page-header__sub-title">404 Error</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="page-container">
        <p>We could not find the page you were looking for.</p>
        <button
          className="btn btn-primary"
          onClick={() => history.push('/')}
        >
          Go home
        </button>
      </div>
    </div>
  );
};

export default NotFoundPage;
