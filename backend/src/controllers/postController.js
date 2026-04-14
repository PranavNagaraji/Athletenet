import Post from "../models/Post.js";
import Athlete from "../models/Athlete.js";
import Coach from "../models/Coach.js";
import Team from "../models/Team.js";

export const createPost = async (req, res) => {
    try {
        const { content, mediaUrl, mediaType, clubId, teamId, tags } = req.body;
        const post = await Post.create({
            author: req.user.id, content, mediaUrl, mediaType,
            club: clubId || null,
            team: teamId || null,
            tags: tags || []
        });
        const populatedPost = await Post.findById(post._id)
            .populate("author", "name profilePic")
            .populate({ path: "club", populate: { path: "admin", select: "name profilePic" } })
            .populate("team", "name");

        const postObj = populatedPost.toObject();
        const club = postObj.club;
        const author = postObj.author || {};
        
        let displayName = "Athletenet Member";
        let displayPic = author.profilePic || "";

        if (club) {
            displayName = club.name || author.name || "Official Club";
            displayPic = club.profilePic || author.profilePic || "";
        } else {
            displayName = author.name || "Athletenet Member";
        }

        res.status(201).json({
            ...postObj,
            branding: {
                name: displayName,
                profilePic: displayPic
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getFeed = async (req, res) => {
    try {
        const posts = await Post.find()
            .populate("author", "name profilePic")
            .populate({ path: "club", populate: { path: "admin", select: "name profilePic" } })
            .populate("team", "name")
            .populate("comments.user", "name profilePic")
            .sort({ createdAt: -1, updatedAt: -1 });

        let userClubs = [];
        let userTeams = [];

        if (req.user) {
            // Find athlete or coach profile to get clubs
            const athlete = await Athlete.findOne({ user: req.user.id });
            const coach = await Coach.findOne({ user: req.user.id });
            
            if (athlete) userClubs = athlete.clubs.map(c => c.toString());
            if (coach) userClubs = coach.clubs.map(c => c.toString());

            // Find teams the user is in
            const teams = await Team.find({
                $or: [
                    { athletes: req.user.id },
                    { coaches: req.user.id }
                ]
            });
            userTeams = teams.map(t => t._id.toString());
        }

        const now = new Date();
        const scoredPosts = posts.map(post => {
            let score = 100; // Base score
            
            // Engagement boost
            score += (post.likes?.length || 0) * 10;
            score += (post.comments?.length || 0) * 25;

            // Membership boost (Prioritize teams then clubs)
            if (post.team && userTeams.includes(post.team._id.toString())) {
                score *= 4; // High priority for your own teams
            } else if (post.club && userClubs.includes(post.club._id.toString())) {
                score *= 2.5; // Medium priority for your clubs
            }

            // Recency decay
            const hoursSince = Math.abs(now - new Date(post.createdAt)) / 36e5;
            const decay = 1 / Math.pow(hoursSince + 2, 1.1);
            
            return { post, finalScore: score * decay };
        });

        const results = scoredPosts.map(sp => {
            const postObj = sp.post.toObject();
            
            // Resolve Branding: Club Identity vs Post Author
            const club = postObj.club;
            const author = postObj.author || {};
            
            // Priority: Club Custom Name > Admin Name (if it's a club post) > Author's Personal Name
            let displayName = "Athletenet Member";
            let displayPic = author.profilePic || "";

            if (club) {
                // It's an official club/team post
                displayName = club.name || author.name || "Official Club";
                displayPic = club.profilePic || author.profilePic || "";
            } else {
                // It's a personal post
                displayName = author.name || "Athletenet Member";
            }
            
            return {
                ...postObj,
                branding: {
                    name: displayName,
                    profilePic: displayPic
                },
                trending: sp.finalScore > 150,
                recommended: sp.post.team && userTeams.includes(sp.post.team._id.toString())
            };
        }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.status(200).json(results);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const toggleLike = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: "Post not found" });

        const index = post.likes.indexOf(req.user.id);
        if (index === -1) {
            post.likes.push(req.user.id);
        } else {
            post.likes.splice(index, 1);
        }

        await post.save();
        res.status(200).json(post);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const addComment = async (req, res) => {
    try {
        const { text } = req.body;
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: "Post not found" });

        post.comments.push({ user: req.user.id, text });
        await post.save();
        
        const updatedPost = await Post.findById(req.params.id)
            .populate("author", "name profilePic")
            .populate({ path: "club", populate: { path: "admin", select: "name profilePic" } })
            .populate("comments.user", "name profilePic");
            
        const postObj = updatedPost.toObject();
        const club = postObj.club;
        const author = postObj.author || {};

        let displayName = "Athletenet Member";
        let displayPic = author.profilePic || "";

        if (club) {
            displayName = club.name || author.name || "Official Club";
            displayPic = club.profilePic || author.profilePic || "";
        } else {
            displayName = author.name || "Athletenet Member";
        }

        res.status(200).json({
            ...postObj,
            branding: {
                name: displayName,
                profilePic: displayPic
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
