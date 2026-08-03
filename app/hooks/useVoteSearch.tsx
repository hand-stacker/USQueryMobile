import useGetRecentVotes from "./useGetRecentVotes";
import useGetVotesByKeyword from "./useGetVotesByKeyword";

interface props{
    vars: any;
    searchType: 'subject' | 'keyword';
}

// helper hook to determine which search hook to use based on the search type
export function useVoteSearch({ vars, searchType }: props) {
    const keyword = vars.keyword?.trim() ?? '';
    const subjectResult = useGetRecentVotes(vars.after, vars.bill_type, vars.first, vars.congress_num, vars.subject_list, vars.sort, { skip: searchType !== 'subject' });
    // getVotesByKeyword requires a non-empty keyword, so skip until we have one.
    const keywordResult = useGetVotesByKeyword(vars.after, vars.bill_type, vars.first, vars.congress_num, keyword, vars.sort, { skip: searchType !== 'keyword' || !keyword });
  return searchType === 'keyword' ? keywordResult : subjectResult;
}

export default useVoteSearch;
