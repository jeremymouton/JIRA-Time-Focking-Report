const nickname = "";
const from = "2018-07-31";
const to = "2018-09-11";
const atlassian = "your-atlassian";

const dateFrom = new Date(from);
const dateTo = new Date(to);

const isMine = worklog => {
  return worklog.author.key === nickname;
};

const isRightDate = worklog => {
  const date = new Date(worklog.started);
  return (
    date.getTime() < dateTo.getTime() && date.getTime() > dateFrom.getTime()
  );
};

const fetchIssueDetails = async (title, key) => {
  return await fetch(
    `https://${atlassian}.atlassian.net/rest/api/2/issue/${key}/worklog`,
    { credentials: "include" }
  )
    .then(response => response.json())
    .then(data => {
      const { worklogs } = data;
      let summary = 0;
      worklogs
        .filter(isMine)
        .filter(isRightDate)
        .map(worklog => {
          summary += worklog.timeSpentSeconds;
        });
      return `${title},${key},${summary}`;
    });
};

const issueToCSV = async issue => {
  const key = issue.key;
  const worklog = issue.fields.worklog;
  const title = issue.fields.summary;
  if (worklog.maxResults <= worklog.total) {
    return await fetchIssueDetails(title, key);
  } else {
    let summary = 0;
    worklog.worklogs
      .filter(isMine)
      .filter(isRightDate)
      .map(worklog => {
        summary += worklog.timeSpentSeconds;
      });
    return `${title},${key},${summary}`;
  }
};

const toCSV = async data => {
  const rows = await Promise.all(
    data.issues.map(async issue => {
      return await issueToCSV(issue);
    })
  );
  console.log(rows.join("\n"));
};

const requestBody = {
  fields: ["worklog", "summary"],
  jql: `worklogAuthor in ('${nickname}') and worklogDate >= '${from}' and worklogDate < '${to}'`,
  maxResults: 1000
};

fetch(`https://${atlassian}.atlassian.net/rest/api/2/search`, {
  headers: {
    "Content-Type": "application/json; charset=utf-8"
  },
  method: "post",
  credentials: "include",
  body: JSON.stringify(requestBody)
})
  .then(response => response.json())
  .then(data => toCSV(data));
