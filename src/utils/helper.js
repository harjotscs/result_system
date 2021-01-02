const expand = (result, block) => {
  var accum = "";
  var newContext = {};
  let max_total = 0;
  let max_obtained = 0;
  let percentage;
  //   console.log(result.sub_name.length);
  //   console.log(block);
  for (var i = 0; i < result.sub_name.length; ++i) {
    max_total += Number(result.max_marks[i]);
    max_obtained += Number(result.marks_obtained[i]);
    if (i === result.sub_name.length - 1) {
      (percentage = (max_obtained / max_total) * 100),
        (newContext = {
          sub_name: result.sub_name[i],
          marks_max: result.max_marks[i],
          marks_obtained: result.marks_obtained[i],
          max_total,
          max_obtained,
          percentage: Math.round(percentage),
        });
    } else {
      newContext = {
        sub_name: result.sub_name[i],
        marks_max: result.max_marks[i],
        marks_obtained: result.marks_obtained[i],
      };
    }
    accum += block.fn(newContext);
  }
  //   console.log(accum);
  //   console.log("done");
  return accum;
};
module.exports = { expand };
