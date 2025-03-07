export interface TopicData {
  id: string;
  name: string;
  traffic_now: number;
  cost_now: number;
  keywords_now: number;
  position: number;
}

export interface ApiResponse {
  result: {
    count: number;
    rows: TopicData[];
  };
}

async function fetchTHApi(args: any) {
  const data = await fetch("/api/topics", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
  });

  return await data.json();
}

export async function fetchTopics(): Promise<ApiResponse> {
  return await fetchTHApi([
    "Topic",
    { project_id: "9d6ec66c-50b0-4f9c-a8d2-0cae864afe61" },
    null,
    [["traffic_now", "DESC"]],
    50,
    0,
    true,
  ]);
}

export async function fetchTopicData(topicId: string): Promise<{
  matchedKeywordsResponse;
  missedKeywordsResponse;
  urlsResponse;
}> {
  const missedKeywordsResponse = await fetchTHApi([
    "Keyword",
    {
      project_id: "9d6ec66c-50b0-4f9c-a8d2-0cae864afe61",
      topic_id: topicId,
      is_miss: true,
    },
    [
      "id",
      "name",
      "traffic_now",
      "cost_now",
      "frequency",
      "frequency_cost",
      "traffic_lost",
      "traffic_all",
      "cost_lost",
      "cost_all",
      "project_id",
      "topic_id",
      "topic.name",
      "group_id",
      "cpc",
      "url",
      "dynamics",
      "types",
      "found_results",
      "positions",
      "competitors",
      "is_miss",
      "position",
      "position_f",
    ],
    [["traffic_lost", "DESC"]],
    10,
    0,
    true,
  ]);

  const matchedKeywordsResponse = await fetchTHApi([
    "Keyword",
    {
      project_id: "9d6ec66c-50b0-4f9c-a8d2-0cae864afe61",
      topic_id: topicId,
      is_miss: false,
    },
    [
      "id",
      "name",
      "traffic_now",
      "cost_now",
      "frequency",
      "frequency_cost",
      "traffic_lost",
      "traffic_all",
      "cost_lost",
      "cost_all",
      "project_id",
      "topic_id",
      "topic.name",
      "group_id",
      "cpc",
      "url",
      "dynamics",
      "types",
      "found_results",
      "positions",
      "competitors",
      "is_miss",
      "position",
      "position_f",
    ],
    [["traffic_lost", "DESC"]],
    10,
    0,
    true,
  ]);

  const urlsResponse = await fetchTHApi([
    "Url",
    {
      project_id: "9d6ec66c-50b0-4f9c-a8d2-0cae864afe61",
      topic_id: topicId,
    },
    [
      "id",
      "name",
      "traffic_now",
      "cost_now",
      "frequency",
      "frequency_cost",
      "project_id",
      "site_id",
      "topic_id",
      "positions",
      "is_main",
      "site_num",
      "domain",
      "cpc",
      "topic.name",
    ],
    [["traffic_now", "DESC"]],
    10,
    0,
    true,
  ]);

  return { matchedKeywordsResponse, missedKeywordsResponse, urlsResponse };
}
