import React from "react";

const GameData = () => {
  return (
    <div className="flex gap-4 ">
      <div className="flex-1 flex flex-col rounded-2xl border bg-linear-to-b from-[#2a282b] to-[#070405] border-white/10 p-4 shadow-lg">
        <p className="text-gray-400 text-sm">Multiplier</p>
        <p className="text-white text-2xl font-semibold">1.00x</p>
      </div>
      <div className="flex-1 flex flex-col rounded-2xl border bg-linear-to-b from-[#2a282b] to-[#070405] border-white/10 p-4 shadow-lg">
        <p className="text-gray-400 text-sm">To Win</p>
        <p className=" text-2xl font-semibold text-[#a9062c]">$ 0.11 </p>
      </div>
    </div>
  );
};

export default GameData;
