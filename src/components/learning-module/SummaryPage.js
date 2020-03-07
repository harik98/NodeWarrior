import { React, useState, useEffect } from 'react';
import NavBar from '../common/NavBar';
import PageNotFound from '../common/PageNotFound';
import SubModuleProgressRow from './SubModuleProgressRow';
import { useParams } from 'react-router-dom';
import { useHistory } from "react-router-dom";
import contentOutline from '../../lesson-content/contentOutline.json';
import useModuleCompletionState, { filenameToSubModuleKey } from '../../hooks/useModuleCompletionState';

function SummaryPage() {
  const history = useHistory();
  const { module } = useParams();
  const [summaryHeightCalcString, setSummaryHeightCalcString] = useState("")
  const {
    completionState,
    getCompletionState,
    updateCompletionState,
    getCurrentSubmodule
  } = useModuleCompletionState(module);

  useEffect(() => {
    // Calculate the height of the summary-modules-container based on summary-modules
    const summaryModules = document.querySelector(".summary-modules");
    const summaryModulesHeight = summaryModules.offsetHeight;
    setSummaryHeightCalcString("calc(" + summaryModulesHeight + " + 4em);")
  }, []);

  const moduleObj = contentOutline.modules.find(moduleObj => moduleObj.directory === module);
  if (moduleObj == null) {
    return <PageNotFound />
  }

  const { name, descriptionParagraphs, whatYouWillLearnParagraphs, submodules } = moduleObj;
  const moduleLink = '/learn/' + module;
  const getStartedLink = moduleLink + '/' + getCurrentSubmodule(submodules);

  const onClickHeroBtn = () => {
    history.push(getStartedLink);
  };

  return (
    <div>
      <NavBar navBarType="homepage" />

      <div className="summary-hero-container">
        <h1>Learn {name}s</h1>
        <button onClick={onClickHeroBtn} className="hero-btn">
          <span className="bold">{completionState != null ? 'Continue Module' : 'Get Started'}</span>
        </button>
      </div>

      <div className="summary-page-content">
        <div className="summary-overview-container">
          <h2>Module Overview</h2>
          {
            descriptionParagraphs.map((paragraph, i) => {
              return <p className="summary-page-description" key={i}>{paragraph}</p>
            })
          }
          <h2>What You'll Learn</h2>
          {
            whatYouWillLearnParagraphs.map((paragraph, i) => {
              return <p className="summary-page-description" key={i}>{paragraph}</p>
            })
          }
        </div>
        <div className="summary-modules-container" style={{ "height": summaryHeightCalcString }}>
          <div className="summary-modules">
            {
              submodules.map((submodule, i) => {
                const link = moduleLink + '/' + filenameToSubModuleKey(submodule.filename);
                return <SubModuleProgressRow
                  key={i}
                  moduleTitle={submodule.name}
                  link={link}
                  completionState={getCompletionState(submodule.filename)}
                  selected={false}
                  completionStateChanged={(state) => updateCompletionState(submodule.filename, state)}
                  rowClass="syllabus-row"
                />
              })
            }
          </div>
        </div>
      </div>
    </div>
  );
}

export default SummaryPage;
