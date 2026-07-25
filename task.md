# ContextAI - A notebookLM themed webapp

This is a notebook LM typeof app where , the user can drop their sources (pdf , websites , yt links , vtt ) ot maybe texts and
then a RAG pipeline runs and return the user the most relevant chunks from their sources .

# THE MAIN APP

It has a chatGPT like interface for chatting with the user , where the users can ask ask their questions and the agents understands the user
and performs semantic search from the uploaded sources (if not provided any resources give the user answers from the ai agent directly).
This is the main chatting interface for the user , where they will interact with the app .

# THE SIDEBAR

It is the section where the user can add their soruces .
The sources could be in the format PDF , vtt , yt link , a website link ..
The RAG then performs parsing , chunking and indexing on the uploaded files accordingly .
When the file is being uploaded , display a yellow dot light , where it says "File is indexing" and when the file is uplaoded , display green dot light , which says "FIle indexed" . Show the user this "File is indexing" || "File is indexed" when the hover over the source , else only show them the source and the yellow/green dot badge(light)

# The NAVBAR

should be a basic navbar , having the options notbook name , create new notebook , user account badge

# Landing page

A modern landing page with lack and white themed , havig smooth transitions , some beautiful components , and a good UI and UX
Should be minimal and more of user focused , so that the user can navuagte and understand what the app does in real

# CORE ARCHITECTURE

-user enters -> lands on the landing page and then the user should authenticate before using the app (using clerk here)

-user authenticated -> the user is redirected to the main "/" where the main app lives , the user is not seeing the UI of the app and also , their default account badge on the top right corner (if the user does not have any profile pic , show something default )

- user adds sources -> the user adds their preffered sources out of pdf , yt link , vtt file , website and the user can add the sources
  one by one

- RAG pipeline -> the sources gets parsed (from their specific parser) -> then chunked -> based on the file -> converted to vector embeddings -> then stored to vector store .

- query -> the user can query and get the most relevant answers from the most relevant chunks and also in the UI the sources are added , from where the information has been extracted .

# RULES

- Only authenticated users can view the chat interface .
- At max can send 10 req/day and can only add at max 5 sources for now
- Every input and output chat should go through zod schema and be validated
- Should be very specific and should try to answer from the stored relevant chunks only .

# RAG PIPELINE

we will have 4 different parser , in the parser folder -> yt link , website , vtt , pdf parser
after the parser has parsed with the specified file type -> then do the chunking of the files diff all each of them
create the vector embeddings using the specified model and store them in the vector db .

After it , we will create a simple query pipeline where ,
we will use the HyDe method which is hypothetical document where the agent generates answer for the user query(3-5 lines) and then the hyde answer will be coverted to vector embeddings along with the user query and then there will be semantic search from the vector db and then return the user a better output .
