import React from 'react';

const CassetteAnimation = () => {
  return (
    <div className="cassette-container w-full h-full flex items-center justify-center relative bg-[#1c1c1c]">
      <style>{`
        .cassette-wrapper {
          transform: scale(var(--cassette-scale, 0.4));
          transform-origin: center center;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        @media (min-width: 640px) {
          .cassette-wrapper { --cassette-scale: 0.55; }
        }
        @media (min-width: 1024px) {
          .cassette-wrapper { --cassette-scale: 0.7; }
        }

        .c-card {
          width: 300px;
          height: 200px;
          background: #252525;
          border-radius: 8px;
          box-shadow: rgba(0, 0, 0, 0.8) 0px 10px 20px, rgba(0, 0, 0, 0.6) 0px 7px 13px -3px, rgba(0, 0, 0, 0.5) 0px -3px 0px inset;
        }

        .c-ups {
          display: flex;
        }

        .c-screw1 {
          display: flex;
          color: black;
          border: 1px solid black;
          background-color: lightgrey;
          height: 0.75em;
          width: 0.75em;
          margin: 0.5em;
          border-radius: 50%;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        }

        .c-screw2 {
          display: flex;
          color: black;
          border: 1px solid black;
          background-color: lightgrey;
          height: 0.75em;
          width: 0.7em;
          margin-top: 0.5em;
          margin-left: 15.8em;
          border-radius: 50%;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        }

        .c-downs {
          display: flex;
        }

        .c-screw3 {
          display: flex;
          color: black;
          border: 1px solid black;
          background-color: lightgrey;
          height: 0.75em;
          width: 0.75em;
          margin-top: -1.3em;
          margin-left: 0.5em;
          border-radius: 50%;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        }

        .c-screw4 {
          display: flex;
          color: black;
          border: 1px solid black;
          background-color: lightgrey;
          height: 0.75em;
          width: 0.75em;
          margin-top: -1.3em;
          margin-left: 16.35em;
          border-radius: 50%;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        }

        .c-card1 {
          width: 230px;
          height: 115px;
          margin-top: 0.5em;
          margin-left: 2.18em;
          background-color: #FFFDD0;
          clip-path: polygon(5% 0, 95% 0, 100% 10%, 100% 100%, 100% 100%, 0 100%, 0 100%, 0 10%);
          border-radius: 5px;
        }

        .c-line1 {
          position: relative;
          width: 200px;
          height: 1px;
          background-color: black;
          top: 1em;
          left: 0.8em;
        }

        .c-line2 {
          position: relative;
          width: 200px;
          height: 1px;
          background-color: black;
          top: 2em;
          left: 0.8em;
        }

        .c-yl {
          display: flex;
          width: 228px;
          height: 50px;
          background-color: rgb(242, 188, 0);
          margin-top: 2.5em;
          margin-left: 0.06em;
        }

        .c-roll {
          width: 8em;
          height: 2em;
          margin-left: 3em;
          border-radius: 15px;
          background-color: #171717;
          display: flex;
        }

        .c-tape {
          width: 3em;
          height: 1.5em;
          position: relative;
          left: 0.9em;
          background-color: #252525;
          margin-top: 0.25em;
        }

        .c-s_wheel {
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          top: 0.215em;
          left: 0.15em;
          width: 1.55em;
          height: 1.55em;
          border: 2px dashed #fff;
          box-shadow: 0 0 0 4.4px #fff;
          border-radius: 50%;
          animation: 2s run-cassette infinite linear;
        }

        .c-e_wheel {
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          top: 0.215em;
          left: 1.7em;
          width: 1.55em;
          height: 1.55em;
          border: 2px dashed #fff;
          box-shadow: 0 0 0 4.4px #fff;
          border-radius: 50%;
          animation: 2s run-cassette infinite linear;
        }

        .c-num {
          margin-left: 1.5em;
          align-self: center;
          color: black;
          font-family: monospace;
          font-weight: bold;
          font-size: 16px;
          margin-top: 0;
          margin-bottom: 0;
        }

        .c-or {
          display: flex;
          width: 230px;
          height: 18px;
          background-color: rgb(241, 90, 37);
          margin-top: 0.4em;
          margin-left: 0em;
          border-bottom-left-radius: 4px;
          border-bottom-right-radius: 4px;
          align-items: center;
          justify-content: center;
        }

        .c-time {
          font-size: 0.6em;
          color: white;
          font-weight: bold;
          margin: 0;
        }

        .c-card2_main {
          filter: drop-shadow(4px 4px 14px rgba(0, 0, 0, 1));
        }

        .c-card2 {
          width: 150px;
          height: 50px;
          margin-top: 0em;
          margin-left: 4.6em;
          background-color: #252525;
          clip-path: polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%);
        }

        .c-screw5 {
          position: relative;
          display: flex;
          color: black;
          border: 1px solid black;
          background-color: lightgrey;
          height: 0.75em;
          width: 0.75em;
          left: 4.25em;
          top: -0.5em;
          border-radius: 50%;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        }

        .c-c1 {
          position: relative;
          width: 0.5em;
          height: 0.5em;
          background-color: rgb(190, 190, 190);
          border-radius: 50%;
          left: 1.5em;
          top: 2em;
          font-size: 16px;
        }

        .c-t1 {
          position: relative;
          width: 0.5em;
          height: 0.5em;
          background-color: rgb(190, 190, 190);
          border-radius: 2px;
          left: 3em;
          top: 1em;
          font-size: 16px;
        }

        .c-t2 {
          position: relative;
          width: 0.5em;
          height: 0.5em;
          background-color: rgb(190, 190, 190);
          border-radius: 2px;
          left: 5.7em;
          top: -0.2em;
          font-size: 16px;
        }

        .c-c2 {
          position: relative;
          width: 0.5em;
          height: 0.5em;
          background-color: rgb(190, 190, 190);
          border-radius: 50%;
          left: 7.2em;
          top: -0.2em;
          font-size: 16px;
        }

        @keyframes run-cassette {
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>

      <div className="cassette-wrapper">
        <div className="c-card">
          <div className="c-ups">
            <div className="c-screw1">+</div>
            <div className="c-screw2">+</div>
          </div>
          <div className="c-card1">
            <div className="c-line1" />
            <div className="c-line2" />
            <div className="c-yl">
              <div className="c-roll">
                <div className="c-s_wheel" />
                <div className="c-tape" />
                <div className="c-e_wheel" />
              </div>
              <p className="c-num">90</p>
            </div>
            <div className="c-or">
              <p className="c-time">2×30min</p>
            </div>
          </div>
          <div className="c-card2_main">
            <div className="c-card2">
              <div className="c-c1" />
              <div className="c-t1" />
              <div className="c-screw5">+</div>
              <div className="c-t2" />
              <div className="c-c2" />
            </div>
          </div>
          <div className="c-downs">
            <div className="c-screw3">+</div>
            <div className="c-screw4">+</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CassetteAnimation;
