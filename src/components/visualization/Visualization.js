import React, { useEffect, memo, forwardRef, useImperativeHandle, useRef } from "react";
import anime from 'animejs';

/*
TODOS:
- Height is set ot 80vh -  this is a random number I came up with...
- createNewPointer should be able to create curr/temp pointers on other nodes. Right now head-pointer is only one that exists
- Reverse doesn't work
- Pause works, but we should make it finish the current line
- line numbers can get off if play/pause and next line a lot
*/

/**
  * Required Props:
  * animations {String[]} – Array of Animation strings as defined below
  * updateLine {Function} - Callback run to update the line number of parent
  *
  * Animation strings are comma seperated values. The first value is the name of the function to be called.
  * Other values correspond to arguments to the functions, always as strings.
  * Below is a list of all possible animation string function names and their parameters.
  *
  *  createNewNode:
  *           parameter1 OPTIONAL: Node ID - defaults to next available
  *           Example: "createNewNode,#node3"
  *
  *  createNewPointer:
  *           parameter1: Pointer ID
  *           Example: "createNewPointer,#head-pointer"
  *
  *  deleteNode:
  *           parameter1: Node ID
  *           Example: "deleteNode,#node3"
  *
  *  setNodeData:
  *           parameter1: Node ID
  *           parameter2: data to set
  *           Example: "setNodeData,#node3,5"
  *
  *  insertNodeAtIndex:
  *           parameter1: index to insert the node
  *           parameter2 OPTIONAL: Node ID - if ommitted goes not last created node
  *           parameter3 OPTIONAL: Pointer ID for the node - if ommitted goes to last created node
  *           Example: "insertNodeAtIndex,#node3,#node3-pointer,1"
  *
  *  movePointer:
  *           parameter1: Node ID
  *           parameter2: Number of nodes to move it over, negative to move left
  *           Example: "movePointer,#node3,-1"
  *
  *  setPointerNull:
  *           parameter1: Pointer ID
  *           Example: "setPointerNull,#node3-pointer"
  *
  *  elongatePointer:
  *           parameter1: Pointer ID
  *           Example: "elongatePointer,#node3-pointer"
  */
function VisualizationComponent(props, ref) {
  const { animations, updateLine } = props;
  const ANIME_DURATION = 700;
  const tl = useRef(null);
  const line = useRef(0);
  const nextLineEnabled = useRef(true);
  const isPlayingFullAnimation = useRef(false);

  let invisibleNodes = ["#node1", "#node2", "#node3", "#node4", "#node5"]; // Nodes not on screen
  let nodesToBeInserted = []; // Nodes that are visible but above the list
  const insertedNodes = []; // Nodes in the list

  useImperativeHandle(ref, () => ({
    nextLine,
    playFullAnimation,
    pauseAnimation,
    previousLine
  }));

  const parseAndCallAnimation = animationString => {
    const parameters = animationString.split(',');
    const functionName = parameters[0];
    if (functionName === 'createNewNode') {
      // If no parameters, use first node in invisibleNodes. Update it
      const nodeToCreate = parameters.length > 1 ? parameters[1] : invisibleNodes.shift();
      if (parameters.length > 1) {
        invisibleNodes = invisibleNodes.filter(node => node !== nodeToCreate);
      }
      createNewNode(nodeToCreate);
    } else if (functionName === 'createNewPointer') {
      createNewPointer(parameters[1]);
    } else if (functionName === 'deleteNode') {
      deleteNode(parameters[1]);
    } else if (functionName === 'setNodeData') {
      setNodeData(parameters[1], parameters[2]);
    } else if(functionName === 'insertNodeAtIndex') {
      if (parameters.length === 2) {
        const node = nodesToBeInserted[0];
        insertNodeAtIndex(parameters[1], node, node + '-pointer');
      } else {
        insertNodeAtIndex(parameters[1], parameters[2], parameters[3]);
      }
    } else if (functionName === 'movePointer') {
      movePointer(parameters[1], parameters[2]);
    } else if (functionName === 'setPointerNull') {
      setPointerNull(parameters[1]);
    } else if (functionName === 'elongatePointer') {
      elongatePointer(parameters[1]);
    }
  };

  useEffect(() => {
    tl.current = anime.timeline({
      // Delay is needed, because pause does not happen immediately. This should prevent that race condition.
      delay: 100,
      autoplay: false,
      easing: 'easeOutExpo',
      duration: ANIME_DURATION,
      complete: () => {
        line.current = 0;
        nextLineEnabled.current = true;
        isPlayingFullAnimation.current = false;
      }
    });
    animations.forEach(animationStringArray => {
      if (animationStringArray !== null) {
        animationStringArray.forEach(animationString => {
          parseAndCallAnimation(animationString);
        });
      }
      tl.current.add({
        complete: () => {
          nextLineEnabled.current = true;
          if (!isPlayingFullAnimation.current) {
            pauseAnimation();
          } else {
            line.current++;
            updateLine(line.current);
          }
        }
      });
    });
  });

  const nextLine = () => {
    if (nextLineEnabled.current) {
      if (!isPlayingFullAnimation.current) {
        line.current++;
      }
      updateLine(line.current);
      nextLineEnabled.current = false;
      tl.current.play();
    }
  };

  const playFullAnimation = () => {
    line.current++;
    updateLine(line.current);
    isPlayingFullAnimation.current = true;
    nextLine();
  };

  const pauseAnimation = () => {
    isPlayingFullAnimation.current = false;
    tl.current.pause();
  };

  // TODO this doesn't work
  const previousLine = () => {
    if (nextLineEnabled.current) {
      nextLineEnabled.current = false;
      line.current--;
      updateLine(line.current);
      tl.current.reverse();
      tl.current.play();
    }
  };

  /********* Public Animations *********/

  /**
   * Animation that changes the opacity of the given node to 100%, giving the impression of creating a
   * node.
   * @param {String or DOM Element} node A CSS Selector or DOM Element representing a linked list node
   */
  const createNewNode = node => {
    // If we create the first node, always just insert it
    if (insertedNodes.length === 0) {
      insertedNodes.push(node);
      tl.current.add({
        targets: node,
        translateY: '+=150px',
      }, '-=' + ANIME_DURATION);
    } else {
      nodesToBeInserted.push(node);
    }
    tl.current.add({
      targets: node,
      opacity: '1'
    });
  };

  const createNewPointer = pointer => {
    tl.current.add({
      targets: pointer,
      opacity: '1'
    });
  };


  /**
   * Animation that changes the opacity of the given node to 0%, giving the impression of deleting a
   * node.
   * @param {String or DOM Element} node A CSS Selector or DOM Element representing a linked list node
   */
  const deleteNode = node => {
    tl.current.add({
      targets: node,
      opacity: '0'
    });
  };

  const setNodeData = (node, data) => {
    const nodeDataId = node + '-data';
    const dataFieldContainer = document.querySelector(node + " > .node-data-field");
    const currData = document.getElementById(nodeDataId.substr(1));

    // Create new data text element to replace old data text element
    const newData = document.createElementNS("http://www.w3.org/2000/svg", "text");
    newData.classList.add("text");
    newData.setAttribute("x", "101px");
    newData.setAttribute("y", "70px");
    newData.setAttribute("fill", "#000");
    newData.setAttribute("opacity", "0");
    newData.textContent = data;
    dataFieldContainer.appendChild(newData);

    // Fade out old data
    tl.current.add({
      targets: currData,
      translateY: '-=15px',
      opacity: '0'
    });

    // Fade in new data
    tl.current.add({
      targets: newData,
      translateY: '-=15px',
      opacity: '1'
    }, '-=' + ANIME_DURATION); // Offset ensures that both animations happen at the same time
  };

  const insertNodeAtIndex = (index, node, pointer) => {
    // TODO can we remove the pointer parameter and just do const pointer = node + "-pointer";
    // TODO: insertAtHead, insertMiddle, insertAtTail internal functions

    // Make room in Linked List for new node
    tl.current.add({
      targets: ['#head-pointer'].concat(insertedNodes),
      translateX: '+=200px'
    });

    // Move new node inline with list
    tl.current.add({
      targets: node,
      translateY: '+=150px'
    });

    // Set new node pointer to head node
    tl.current.add({
      targets: pointer,
      width: '+=100px'
    });
    nodesToBeInserted = nodesToBeInserted.filter(oldNode => oldNode !== node);
    insertedNodes.push(node);
  };

  /**
   * Moves a pointer some number of nodes over from its current position
   * @param numNodes {Number} Number of nodes to move the pointer. Negative to move left
   */
  const movePointer = (pointer, numNodes) => {
    const distance = Math.abs(200 * numNodes);
    const direction = numNodes < 0 ? '-=' : '+=';
    tl.current.add({
      targets: pointer,
      translateX: direction + distance + 'px',
    });
  };

  const setPointerNull = pointer => {
    tl.current.add({
      targets: pointer + '-tip',
      translateY: '+=75px',
      height: '-=75px'
    });
  };

  const elongatePointer = pointer => {
    tl.current.add({
      targets: pointer + '-tip',
      translateY: '-=75px',
      height: '+=75px'
    });
  };

  /********* Example Combined Animations (TODO DELETE THESE) *********/

  // const setFirstNodeData = () => {
  //   setNodeData("#node1", 34);
  // };
  //
  // const insertNodesAtHead = () => {
  //   for (let node of invisibleNodes) {
  //     const pointer = node + "-pointer";
  //
  //     // Create new node
  //     createNewNode(node);
  //
  //     // Insert new node at head
  //     insertNodeAtIndex(0, node, pointer);
  //
  //     // Set head pointer to new node
  //     movePointer('#head-pointer' , -1);
  //
  //     // Add new node to inserted nodes list
  //     insertedNodes.push(node);
  //   }
  // };

  return (
    <div>
      <svg width="100%" height="80vh">
        <svg x="50px" y="calc(80vh / 2 - 200px)">
          <g id="node6" className="node hidden">
            <rect x="0" y="0" rx="12px" />
            <g className="node-header">
              <text x="50px" y="20px">Node</text>
              <rect x="0px" y="28px"/ >
            </g>
            <g className="node-data-field">
              <text x="10px" y="55px">data</text>
              <text x="60px" y="55px">=</text>
              <rect x="85px" y="39px"/ >
              <text id="node6-data" x="101px" y="55px">23</text>
            </g>
            <g className="node-next-field">
              <text x="10px" y="82px">next</text>
              <text x="60px" y="82px">=</text>
              <rect x="85px" y="66px"/ >
              <g className="node-pointer">
                <circle r="7px" cx="110px" cy="76px"/ >
                <rect id="node6-pointer" width="0px" x="110px" y="74px"/ >
              </g>
            </g>
          </g>
        </svg>

        <svg x="50px" y="calc(80vh / 2 - 200px)">
          <g id="node5" className="node hidden">
            <rect x="0" y="0" rx="12px"/ >
            <g className="node-header">
              <text x="50px" y="20px">Node</text>
              <rect x="0px" y="28px"/ >
            </g>
            <g className="node-data-field">
              <text x="10px" y="55px">data</text>
              <text x="60px" y="55px">=</text>
              <rect x="85px" y="39px"/ >
              <text id="node5-data" x="101px" y="55px">20</text>
            </g>
            <g className="node-next-field">
              <text x="10px" y="82px">next</text>
              <text x="60px" y="82px">=</text>
              <rect x="85px" y="66px"/ >
              <g className="node-pointer">
                <circle r="7px" cx="110px" cy="76px"/ >
                <rect id="node5-pointer" width="0px" x="110px" y="74px"/ >
              </g>
            </g>
          </g>
        </svg>

        <svg x="50px" y="calc(80vh / 2 - 200px)">
          <g id="node4" className="node hidden">
            <rect x="0" y="0" rx="12px"/ >
            <g className="node-header">
              <text x="50px" y="20px">Node</text>
              <rect x="0px" y="28px"/ >
            </g>
            <g className="node-data-field">
              <text x="10px" y="55px">data</text>
              <text x="60px" y="55px">=</text>
              <rect x="85px" y="39px"/ >
              <text id="node4-data" x="101px" y="55px">90</text>
            </g>
            <g className="node-next-field">
              <text x="10px" y="82px">next</text>
              <text x="60px" y="82px">=</text>
              <rect x="85px" y="66px"/ >
              <g className="node-pointer">
                <circle r="7px" cx="110px" cy="76px"/ >
                <rect id="node4-pointer" width="0px" x="110px" y="74px"/ >
              </g>
            </g>
          </g>
        </svg>

        <svg x="50px" y="calc(80vh / 2 - 200px)">
          <g id="node3" className="node hidden">
            <rect x="0" y="0" rx="12px"/ >
            <g className="node-header">
              <text x="50px" y="20px">Node</text>
              <rect x="0px" y="28px"/ >
            </g>
            <g className="node-data-field">
              <text x="10px" y="55px">data</text>
              <text x="60px" y="55px">=</text>
              <rect x="85px" y="39px"/ >
              <text id="node3-data" x="101px" y="55px">88</text>
            </g>
            <g className="node-next-field">
              <text x="10px" y="82px">next</text>
              <text x="60px" y="82px">=</text>
              <rect x="85px" y="66px"/ >
              <g className="node-pointer">
                <circle r="7px" cx="110px" cy="76px"/ >
                <rect id="node3-pointer" width="0px" x="110px" y="74px"/ >
              </g>
            </g>
          </g>
        </svg>

        <svg x="50px" y="calc(80vh / 2 - 200px)">
          <g id="node2" className="node hidden">
            <rect x="0" y="0" rx="12px"/ >
            <g className="node-header">
              <text x="50px" y="20px">Node
              </text>
              <rect x="0px" y="28px"/ >
            </g>
            <g className="node-data-field">
              <text x="10px" y="55px">data
              </text>
              <text x="60px" y="55px">=</text>
              <rect x="85px" y="39px"/ >
              <text id="node2-data" x="101px" y="55px">72</text>
            </g>
            <g className="node-next-field">
              <text x="10px" y="82px">next</text>
              <text x="60px" y="82px">=</text>
              <rect x="85px" y="66px"/ >
              <g className="node-pointer">
                <circle r="7px" cx="110px" cy="76px"/ >
                <rect id="node2-pointer" width="0px" x="110px" y="74px"/ >
              </g>
            </g>
          </g>
        </svg>

        <svg x="50px" y="calc(80vh / 2 - 200px)">
          <g id="node1" className="node hidden">
            <rect x="0" y="0" rx="12px"/ >
            <g className="node-header">
              <text x="50px" y="20px">Node</text>
              <rect x="0px" y="28px"/ >
            </g>
            <g className="node-data-field">
              <text x="10px" y="55px">data</text>
              <text x="60px" y="55px">=</text>
              <rect x="85px" y="39px"/ >
              <text id="node1-data" width="0px" x="101px" y="55px">56</text>
            </g>
            <g className="node-next-field">
              <text x="10px" y="82px">next</text>
              <text x="60px" y="82px">=</text>
              <rect x="85px" y="66px"/ >
              <g className="node-pointer">
                <circle r="7px" cx="110px" cy="76px"/ >
                <rect width="0px" x="110px" y="74px"/ >
              </g>
            </g>
          </g>
        </svg>

        <svg x="100px" y="calc(80vh / 2 + 60px)">
          <g id="head-pointer" className="hidden">
            <rect
              id="head-pointer-tip"
              width="4px"
              height="75px"
              x="20px" / >
            <circle r="4px" cx="22px" cy="75px"/ >
            <text x="0px" y="100px">head</text>
          </g>
        </svg>
      </svg>
    </div>
  );
}

/**
 * Controls if the component should rerender. We only want this to occur
 * when a new animation is being loaded in. Otherwise rerendering will break
 * animations in progress.
 *
 * If returns true, don't rerender. Else rerender as usual
 */
function shouldPreventRerender (prevProps, nextProps) {
  return nextProps.animations === null || prevProps.animations === nextProps.animations;
};

const Visualization = memo(forwardRef(VisualizationComponent), shouldPreventRerender);

export default Visualization;
